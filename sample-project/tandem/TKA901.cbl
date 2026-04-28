      *-----------------------------------------------------------------
      * TKA901 — ADD_LOAN Server Program
      *
      * Invoked by the TAL Gateway on the HP NonStop Tandem node when
      * a TME message with mnemonic ADD_LOAN is received from the
      * VC++ client via fgatetcp. The routing entry in LSS001T maps
      *   MNEMONIC   = 'ADD_LOAN'
      *   PROGRAM_NM = 'TKA901'
      *
      * Input:  New loan fields from WS-ADD-REQUEST-BLOCK
      * Output: WS-STATUS-CODE and WS-NEW-LOAN-ID on success
      *
      * SQL/MP dialect — executed on HP NonStop SQL/MX guardian volume.
      *-----------------------------------------------------------------
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TKA901.
       AUTHOR.     TRACKALL-PLATFORM-TEAM.

      *-----------------------------------------------------------------
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. HP-NONSTOP.
       OBJECT-COMPUTER. HP-NONSTOP.

      *-----------------------------------------------------------------
       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  WS-ADD-REQUEST-BLOCK.
           05  WS-LOAN-NUM          PIC X(10).
           05  WS-CLIENT-ID         PIC X(8).
           05  WS-BORROWER-NAME     PIC X(40).
           05  WS-PROPERTY-STATE    PIC X(2).
           05  WS-COVERAGE-TYPE     PIC X(10).
           05  WS-PROPERTY-VALUE    PIC 9(10).
           05  WS-FCI-CODE          PIC X(6).
           05  WS-EDI-FLAG          PIC X(1).
           05  WS-LOAN-STATUS       PIC X(10).
           05  WS-UPB               PIC 9(15).
           05  WS-MORTGAGEE-CLAUSE  PIC X(255).
           05  WS-PROPERTY-ADDRESS  PIC X(100).
           05  WS-PROPERTY-CITY     PIC X(50).
           05  WS-PROPERTY-ZIP      PIC X(10).
           05  WS-PROPERTY-TYPE     PIC X(20).
           05  WS-BORROWER-PHONE    PIC X(20).

       01  WS-SQLCODE               PIC S9(9) COMP.
       01  WS-STATUS-CODE           PIC X(4)    VALUE '0000'.
       01  WS-STATUS-MESSAGE        PIC X(80)   VALUE SPACES.
       01  WS-NEW-LOAN-ID           PIC X(10)   VALUE SPACES.

      *-----------------------------------------------------------------
       PROCEDURE DIVISION.

       0000-MAIN.
           PERFORM 1000-RECEIVE-REQUEST
           PERFORM 2000-VALIDATE-ADD
           IF WS-STATUS-CODE = '0000'
               PERFORM 3000-INSERT-LOAN
           END-IF
           PERFORM 9000-SEND-RESPONSE
           STOP RUN.

      *-----------------------------------------------------------------
       1000-RECEIVE-REQUEST.
      *    In production, the TAL Gateway populates WS-ADD-REQUEST-BLOCK
      *    by deserialising the inbound TME message buffer received over
      *    the fgatetcp TCP socket.
           MOVE SPACES TO WS-LOAN-NUM
           MOVE SPACES TO WS-BORROWER-NAME
           MOVE SPACES TO WS-PROPERTY-ADDRESS
           MOVE SPACES TO WS-LOAN-STATUS
           MOVE ZERO   TO WS-PROPERTY-VALUE
           MOVE ZERO   TO WS-UPB.

      *-----------------------------------------------------------------
       2000-VALIDATE-ADD.
      *    Server-side validation mirrors CLoanRules::ValidateLoanForAdd.
      *    Both the VC++ client and this COBOL program enforce the rules
      *    to prevent invalid data reaching LSS_LOAN_T regardless of
      *    the originating path (GUI, batch, or direct TME call).

      *    Loan number must be exactly 10 characters — CHAR(10) NOT NULL
      *    primary key on LSS_LOAN_T.
           IF FUNCTION LENGTH(FUNCTION TRIM(WS-LOAN-NUM)) NOT = 10
               MOVE '9101' TO WS-STATUS-CODE
               MOVE 'Loan number must be exactly 10 digits' TO
                    WS-STATUS-MESSAGE
           END-IF.

      *    Borrower name is required for all new loan records.
           IF WS-STATUS-CODE = '0000' AND
              WS-BORROWER-NAME = SPACES
               MOVE '9102' TO WS-STATUS-CODE
               MOVE 'Borrower name is required' TO WS-STATUS-MESSAGE
           END-IF.

      *    Property value must be greater than zero for LPI tracking.
           IF WS-STATUS-CODE = '0000' AND
              WS-PROPERTY-VALUE = ZERO
               MOVE '9103' TO WS-STATUS-CODE
               MOVE 'Property value must be greater than zero' TO
                    WS-STATUS-MESSAGE
           END-IF.

      *    Property address is required for carrier eligibility and
      *    lender notification letter generation.
           IF WS-STATUS-CODE = '0000' AND
              WS-PROPERTY-ADDRESS = SPACES
               MOVE '9104' TO WS-STATUS-CODE
               MOVE 'Property address is required' TO WS-STATUS-MESSAGE
           END-IF.

      *    Initial loan status must be ACTIVE. DELINQUENT and CLOSED
      *    statuses are only reached through governed MODIFY_LOAN transitions.
           IF WS-STATUS-CODE = '0000' AND
              WS-LOAN-STATUS NOT = 'ACTIVE     '
               MOVE '9105' TO WS-STATUS-CODE
               MOVE 'New loans must have initial status ACTIVE' TO
                    WS-STATUS-MESSAGE
           END-IF.

      *    Unpaid principal balance must be greater than zero.
           IF WS-STATUS-CODE = '0000' AND
              WS-UPB = ZERO
               MOVE '9106' TO WS-STATUS-CODE
               MOVE 'Unpaid principal balance must be greater than zero'
                    TO WS-STATUS-MESSAGE
           END-IF.

      *    Property type must be RESIDENTIAL or COMMERCIAL.
           IF WS-STATUS-CODE = '0000' AND
              WS-PROPERTY-TYPE NOT = 'RESIDENTIAL         ' AND
              WS-PROPERTY-TYPE NOT = 'COMMERCIAL          '
               MOVE '9107' TO WS-STATUS-CODE
               MOVE 'Property type must be RESIDENTIAL or COMMERCIAL' TO
                    WS-STATUS-MESSAGE
           END-IF.

      *-----------------------------------------------------------------
       3000-INSERT-LOAN.
           EXEC SQL
               INSERT INTO LSS_LOAN_T
                   (LOAN_NUM,
                    CLIENT_ID,
                    BORROWER_NAME,
                    PROPERTY_STATE,
                    COVERAGE_TYPE,
                    PROPERTY_VALUE,
                    FCI_CODE,
                    EDI_FLAG,
                    LOAN_STATUS,
                    UPB,
                    MORTGAGEE_CLAUSE,
                    PROPERTY_ADDRESS,
                    PROPERTY_CITY,
                    PROPERTY_ZIP,
                    PROPERTY_TYPE,
                    BORROWER_PHONE)
               VALUES
                   (:WS-LOAN-NUM,
                    :WS-CLIENT-ID,
                    :WS-BORROWER-NAME,
                    :WS-PROPERTY-STATE,
                    :WS-COVERAGE-TYPE,
                    :WS-PROPERTY-VALUE,
                    :WS-FCI-CODE,
                    :WS-EDI-FLAG,
                    :WS-LOAN-STATUS,
                    :WS-UPB,
                    :WS-MORTGAGEE-CLAUSE,
                    :WS-PROPERTY-ADDRESS,
                    :WS-PROPERTY-CITY,
                    :WS-PROPERTY-ZIP,
                    :WS-PROPERTY-TYPE,
                    :WS-BORROWER-PHONE)
           END-EXEC

           MOVE SQLCODE TO WS-SQLCODE

           IF WS-SQLCODE = 0
               MOVE WS-LOAN-NUM TO WS-NEW-LOAN-ID
           ELSE IF WS-SQLCODE = -4
               MOVE '9108' TO WS-STATUS-CODE
               MOVE 'Loan number already exists in LSS_LOAN_T' TO
                    WS-STATUS-MESSAGE
           ELSE
               MOVE '9109' TO WS-STATUS-CODE
               MOVE 'LSS_LOAN_T insert failed' TO WS-STATUS-MESSAGE
           END-IF.

      *-----------------------------------------------------------------
       9000-SEND-RESPONSE.
      *    In production, WS-STATUS-CODE and WS-NEW-LOAN-ID are serialised
      *    into the TME response buffer and returned to the VC++ client.
           CONTINUE.
