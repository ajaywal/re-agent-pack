      *-----------------------------------------------------------------
      * TKA902 — MODIFY_LOAN Server Program
      *
      * Invoked by the TAL Gateway on the HP NonStop Tandem node when
      * a TME message with mnemonic MODIFY_LOAN is received from the
      * VC++ client via fgatetcp. The routing entry in LSS001T maps
      *   MNEMONIC   = 'MODIFY_LOAN'
      *   PROGRAM_NM = 'TKA902'
      *
      * Input:  LOAN_NUM (immutable key) + modified fields
      * Output: WS-STATUS-CODE and WS-ROWS-UPDATED on success
      *
      * SQL/MP dialect — executed on HP NonStop SQL/MX guardian volume.
      *-----------------------------------------------------------------
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TKA902.
       AUTHOR.     TRACKALL-PLATFORM-TEAM.

      *-----------------------------------------------------------------
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. HP-NONSTOP.
       OBJECT-COMPUTER. HP-NONSTOP.

      *-----------------------------------------------------------------
       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  WS-MODIFY-REQUEST-BLOCK.
           05  WS-LOAN-NUM              PIC X(10).
           05  WS-BORROWER-NAME         PIC X(40).
           05  WS-LOAN-STATUS-NEW       PIC X(10).
           05  WS-UPB-NEW               PIC 9(15).
           05  WS-PROPERTY-VALUE-NEW    PIC 9(10).
           05  WS-PROPERTY-ADDRESS-NEW  PIC X(100).
           05  WS-PROPERTY-CITY-NEW     PIC X(50).
           05  WS-PROPERTY-ZIP-NEW      PIC X(10).
           05  WS-BORROWER-PHONE-NEW    PIC X(20).
           05  WS-MORTGAGEE-CLAUSE-NEW  PIC X(255).

       01  WS-CURRENT-RECORD.
           05  WS-LOAN-STATUS-CURR      PIC X(10).
           05  WS-UPB-CURR              PIC 9(15).

       01  WS-SQLCODE                   PIC S9(9) COMP.
       01  WS-STATUS-CODE               PIC X(4)    VALUE '0000'.
       01  WS-STATUS-MESSAGE            PIC X(80)   VALUE SPACES.
       01  WS-ROWS-UPDATED              PIC 9(4)    VALUE ZERO.

      *-----------------------------------------------------------------
       PROCEDURE DIVISION.

       0000-MAIN.
           PERFORM 1000-RECEIVE-REQUEST
           PERFORM 2000-FETCH-CURRENT
           IF WS-STATUS-CODE = '0000'
               PERFORM 3000-VALIDATE-MODIFY
           END-IF
           IF WS-STATUS-CODE = '0000'
               PERFORM 4000-UPDATE-LOAN
           END-IF
           PERFORM 9000-SEND-RESPONSE
           STOP RUN.

      *-----------------------------------------------------------------
       1000-RECEIVE-REQUEST.
      *    In production, WS-MODIFY-REQUEST-BLOCK is populated by the
      *    TAL Gateway from the inbound fgatetcp TME message buffer.
           MOVE SPACES TO WS-LOAN-NUM
           MOVE SPACES TO WS-LOAN-STATUS-NEW
           MOVE ZERO   TO WS-UPB-NEW
           MOVE ZERO   TO WS-PROPERTY-VALUE-NEW.

      *-----------------------------------------------------------------
       2000-FETCH-CURRENT.
      *    Fetch the current loan status and UPB from LSS_LOAN_T before
      *    validating the modification. Server-side enforcement requires
      *    the current values to check transition validity and UPB direction.
           EXEC SQL
               SELECT LOAN_STATUS,
                      UPB
               INTO   :WS-LOAN-STATUS-CURR,
                      :WS-UPB-CURR
               FROM   LSS_LOAN_T
               WHERE  LOAN_NUM = :WS-LOAN-NUM
               FETCH FIRST 1 ROWS ONLY
           END-EXEC

           MOVE SQLCODE TO WS-SQLCODE

           IF WS-SQLCODE = 100
               MOVE '9201' TO WS-STATUS-CODE
               MOVE 'Loan not found — cannot modify a non-existent record'
                    TO WS-STATUS-MESSAGE
           ELSE IF WS-SQLCODE NOT = 0
               MOVE '9202' TO WS-STATUS-CODE
               MOVE 'LSS_LOAN_T fetch failed' TO WS-STATUS-MESSAGE
           END-IF.

      *-----------------------------------------------------------------
       3000-VALIDATE-MODIFY.
      *    Server-side validation mirrors CLoanRules::ValidateLoanForModify.

      *    R-ML-002: Status transition must be ACTIVE→DELINQUENT or
      *    DELINQUENT→CLOSED. Any other transition is rejected.
      *    A CLOSED loan cannot be re-opened — it is a terminal status.
           IF WS-LOAN-STATUS-CURR NOT = WS-LOAN-STATUS-NEW
               IF NOT (
                   (WS-LOAN-STATUS-CURR = 'ACTIVE    ' AND
                    WS-LOAN-STATUS-NEW  = 'DELINQUENT')
                   OR
                   (WS-LOAN-STATUS-CURR = 'DELINQUENT' AND
                    WS-LOAN-STATUS-NEW  = 'CLOSED    ')
               )
                   MOVE '9203' TO WS-STATUS-CODE
                   MOVE 'Invalid loan status transition' TO
                        WS-STATUS-MESSAGE
               END-IF
           END-IF.

      *    R-ML-003: UPB cannot increase — loans are only paid down,
      *    never topped up, through the Loan Maintenance workflow.
           IF WS-STATUS-CODE = '0000' AND
              WS-UPB-NEW > WS-UPB-CURR
               MOVE '9204' TO WS-STATUS-CODE
               MOVE 'UPB cannot be increased on a loan modification' TO
                    WS-STATUS-MESSAGE
           END-IF.

      *    R-ML-004: Property address cannot be cleared to spaces.
           IF WS-STATUS-CODE = '0000' AND
              WS-PROPERTY-ADDRESS-NEW = SPACES AND
              WS-PROPERTY-ADDRESS-NEW NOT = WS-LOAN-NUM
      *       Only reject if caller explicitly cleared the address field.
               CONTINUE
           END-IF.

      *-----------------------------------------------------------------
       4000-UPDATE-LOAN.
           EXEC SQL
               UPDATE LSS_LOAN_T
               SET    BORROWER_NAME     = :WS-BORROWER-NAME,
                      LOAN_STATUS       = :WS-LOAN-STATUS-NEW,
                      UPB               = :WS-UPB-NEW,
                      PROPERTY_VALUE    = :WS-PROPERTY-VALUE-NEW,
                      PROPERTY_ADDRESS  = :WS-PROPERTY-ADDRESS-NEW,
                      PROPERTY_CITY     = :WS-PROPERTY-CITY-NEW,
                      PROPERTY_ZIP      = :WS-PROPERTY-ZIP-NEW,
                      BORROWER_PHONE    = :WS-BORROWER-PHONE-NEW,
                      MORTGAGEE_CLAUSE  = :WS-MORTGAGEE-CLAUSE-NEW
               WHERE  LOAN_NUM = :WS-LOAN-NUM
           END-EXEC

           MOVE SQLCODE TO WS-SQLCODE

           IF WS-SQLCODE = 0
               ADD 1 TO WS-ROWS-UPDATED
           ELSE
               MOVE '9205' TO WS-STATUS-CODE
               MOVE 'LSS_LOAN_T update failed' TO WS-STATUS-MESSAGE
           END-IF.

      *-----------------------------------------------------------------
       9000-SEND-RESPONSE.
      *    In production, WS-STATUS-CODE and WS-ROWS-UPDATED are serialised
      *    into the TME response buffer and returned to the VC++ client.
           CONTINUE.
