      *-----------------------------------------------------------------
      * TKA900 — LOAN_SEARCH Server Program
      *
      * Invoked by the TAL Gateway on the HP NonStop Tandem node when
      * a TME message with mnemonic LOAN_SEARCH is received from the
      * VC++ client via fgatetcp. The routing entry in LSS001T maps
      *   MNEMONIC  = 'LOAN_SEARCH'
      *   PROGRAM_NM = 'TKA900'
      *
      * Input:  WS-LOAN-NUM (10 chars) and/or WS-BORROWER-NAME (40 chars)
      * Output: Loan record fields from LSS_LOAN_T joined with
      *         QUOTE_REQD, CYCLE_TYPE from LSS_CYCLE_STEP_T.
      *
      * SQL/MP dialect — executed on HP NonStop SQL/MX guardian volume.
      *-----------------------------------------------------------------
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TKA900.
       AUTHOR.     TRACKALL-PLATFORM-TEAM.

      *-----------------------------------------------------------------
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. HP-NONSTOP.
       OBJECT-COMPUTER. HP-NONSTOP.

      *-----------------------------------------------------------------
       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  WS-REQUEST-BLOCK.
           05  WS-LOAN-NUM         PIC X(10).
           05  WS-BORROWER-NAME    PIC X(40).

       01  WS-RESPONSE-BLOCK.
           05  WS-RESP-LOAN-NUM        PIC X(10).
           05  WS-RESP-CLIENT-ID       PIC X(8).
           05  WS-RESP-BORROWER-NAME   PIC X(40).
           05  WS-RESP-PROPERTY-STATE  PIC X(2).
           05  WS-RESP-COVERAGE-TYPE   PIC X(10).
           05  WS-RESP-PROPERTY-VALUE  PIC 9(10).
           05  WS-RESP-FCI-CODE        PIC X(6).
           05  WS-RESP-EDI-FLAG        PIC X(1).
           05  WS-RESP-QUOTE-REQD      PIC X(1).
           05  WS-RESP-CYCLE-TYPE      PIC X(20).

       01  WS-SQLCODE              PIC S9(9) COMP.
       01  WS-STATUS-CODE          PIC X(4)    VALUE '0000'.
       01  WS-STATUS-MESSAGE       PIC X(80)   VALUE SPACES.
       01  WS-ROWS-FOUND           PIC 9(4)    VALUE ZERO.

      *-----------------------------------------------------------------
       PROCEDURE DIVISION.

       0000-MAIN.
           PERFORM 1000-RECEIVE-REQUEST
           PERFORM 2000-VALIDATE-INPUT
           IF WS-STATUS-CODE = '0000'
               PERFORM 3000-QUERY-LOAN
           END-IF
           IF WS-STATUS-CODE = '0000'
               PERFORM 4000-QUERY-CYCLE-STEP
           END-IF
           PERFORM 9000-SEND-RESPONSE
           STOP RUN.

      *-----------------------------------------------------------------
       1000-RECEIVE-REQUEST.
      *    In production, the TAL Gateway populates WS-REQUEST-BLOCK
      *    by deserialising the inbound TME message buffer. The message
      *    is received over the fgatetcp TCP socket bound to this
      *    program's listener port on the Tandem node.
           MOVE SPACES TO WS-LOAN-NUM
           MOVE SPACES TO WS-BORROWER-NAME.

      *-----------------------------------------------------------------
       2000-VALIDATE-INPUT.
      *    At least one search field must be non-blank. An all-spaces
      *    request would result in an unrestricted LSS_LOAN_T scan,
      *    which is disallowed for performance reasons on the Tandem node.
           IF WS-LOAN-NUM = SPACES AND WS-BORROWER-NAME = SPACES
               MOVE '9001' TO WS-STATUS-CODE
               MOVE 'At least one search criterion required' TO
                    WS-STATUS-MESSAGE
           END-IF.

      *-----------------------------------------------------------------
       3000-QUERY-LOAN.
           EXEC SQL
               SELECT LOAN_NUM,
                      CLIENT_ID,
                      BORROWER_NAME,
                      PROPERTY_STATE,
                      COVERAGE_TYPE,
                      PROPERTY_VALUE,
                      FCI_CODE,
                      EDI_FLAG
               INTO   :WS-RESP-LOAN-NUM,
                      :WS-RESP-CLIENT-ID,
                      :WS-RESP-BORROWER-NAME,
                      :WS-RESP-PROPERTY-STATE,
                      :WS-RESP-COVERAGE-TYPE,
                      :WS-RESP-PROPERTY-VALUE,
                      :WS-RESP-FCI-CODE,
                      :WS-RESP-EDI-FLAG
               FROM   LSS_LOAN_T
               WHERE  (LOAN_NUM = :WS-LOAN-NUM
                          OR :WS-LOAN-NUM = SPACES)
               AND    (BORROWER_NAME LIKE :WS-BORROWER-NAME
                          OR :WS-BORROWER-NAME = SPACES)
               FETCH FIRST 1 ROWS ONLY
           END-EXEC

           MOVE SQLCODE TO WS-SQLCODE

           IF WS-SQLCODE = 0
               ADD 1 TO WS-ROWS-FOUND
           ELSE IF WS-SQLCODE = 100
               MOVE '9002' TO WS-STATUS-CODE
               MOVE 'No matching loan record found' TO WS-STATUS-MESSAGE
           ELSE
               MOVE '9003' TO WS-STATUS-CODE
               MOVE 'LSS_LOAN_T query failed' TO WS-STATUS-MESSAGE
           END-IF.

      *-----------------------------------------------------------------
       4000-QUERY-CYCLE-STEP.
      *    Join to LSS_CYCLE_STEP_T on CLIENT_ID to retrieve the
      *    QUOTE_REQD and CYCLE_TYPE flags for the client associated
      *    with this loan. These fields determine whether the VC++ client
      *    should trigger a RataBase quote after displaying the loan record.
           EXEC SQL
               SELECT QUOTE_REQD,
                      CYCLE_TYPE
               INTO   :WS-RESP-QUOTE-REQD,
                      :WS-RESP-CYCLE-TYPE
               FROM   LSS_CYCLE_STEP_T
               WHERE  CLIENT_ID = :WS-RESP-CLIENT-ID
               FETCH FIRST 1 ROWS ONLY
           END-EXEC

           MOVE SQLCODE TO WS-SQLCODE

           IF WS-SQLCODE NOT = 0 AND WS-SQLCODE NOT = 100
               MOVE '9004' TO WS-STATUS-CODE
               MOVE 'LSS_CYCLE_STEP_T query failed' TO WS-STATUS-MESSAGE
           END-IF.

      *-----------------------------------------------------------------
       9000-SEND-RESPONSE.
      *    In production, WS-RESPONSE-BLOCK is serialised into the TME
      *    response message buffer and returned to the fgatetcp socket.
      *    The VC++ client library deserialises the buffer into CLoan.
           CONTINUE.
