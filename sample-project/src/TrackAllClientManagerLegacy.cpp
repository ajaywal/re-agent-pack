#include <afxcmn.h>
#include <afxdisp.h>

#include "TrackAllClientManagerLegacy.h"

#include "LoanRules.h"
#include "TMELibAdapter.h"
#include "RataBaseServiceAdapter.h"
#include "EDINotificationWriter.h"
#include "LoanSearchDlg.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#endif

BEGIN_MESSAGE_MAP(CTrackAllClientManagerLegacyApp, CWinApp)
END_MESSAGE_MAP()

CTrackAllClientManagerLegacyApp theApp;

BOOL CTrackAllClientManagerLegacyApp::InitInstance()
{
    INITCOMMONCONTROLSEX initCtrls;

    initCtrls.dwSize = sizeof(initCtrls);
    initCtrls.dwICC = ICC_WIN95_CLASSES;
    InitCommonControlsEx(&initCtrls);

    CWinApp::InitInstance();
    AfxEnableControlContainer();
    SetRegistryKey(_T("TrackAllClientManagerLegacy"));

    CLoanRules loanRules;
    CTMELibAdapter tmeLib;
    CRataBaseServiceAdapter rataBase(&loanRules);
    CEDINotificationWriter ediWriter(&loanRules, &tmeLib);
    CLoanSearchDlg dlg(&loanRules, &tmeLib, &rataBase, &ediWriter);

    m_pMainWnd = &dlg;
    dlg.DoModal();

    return FALSE;
}
