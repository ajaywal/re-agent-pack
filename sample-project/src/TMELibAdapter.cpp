#include "TMELibAdapter.h"

CTMELibAdapter::CTMELibAdapter()
{
    LoadRoutingTable();
}

void CTMELibAdapter::LoadRoutingTable()
{
    // Populate the in-memory mnemonic routing table.
    // In production, this mapping is loaded from the LSS001T table on the
    // HP NonStop backend at application startup. Each row in LSS001T contains
    // a mnemonic, the corresponding Tandem program name, and a description.
    // The fgatetcp TCP connection resolves the program name to a listener
    // port on the Tandem node. Here we seed the table directly to mirror
    // that pattern without a live Tandem connection.

    m_routingTable[_T("LOAN_SEARCH")]   = _T("TKA900");
    m_routingTable[_T("ADD_LOAN")]      = _T("TKA901");
    m_routingTable[_T("MODIFY_LOAN")]   = _T("TKA902");
    m_routingTable[_T("QUOTE_REQUEST")] = _T("TKARB000");
    m_routingTable[_T("LOAN_UPDATE")]   = _T("TKA910");
    m_routingTable[_T("14E_NOTIFY")]    = _T("TKA920");
    m_routingTable[_T("KY_ISO_QUERY")]  = _T("AIP930");
}

CString CTMELibAdapter::ResolveProgramName(const CString& strMnemonic) const
{
    std::map<CString, CString>::const_iterator it = m_routingTable.find(strMnemonic);

    if (it == m_routingTable.end())
    {
        return _T("");
    }

    return it->second;
}

BOOL CTMELibAdapter::SendMessage(
    const CString& strMnemonic,
    const CString& strRequestData,
    CString& strResponseData,
    CString& strErrorMessage) const
{
    if (strMnemonic.IsEmpty())
    {
        strErrorMessage = _T("TME mnemonic must not be blank.");
        return FALSE;
    }

    // Mnemonic must be registered in the routing table before a send can proceed.
    // An unknown mnemonic indicates a configuration error — either the LSS001T
    // row is missing on the Tandem side or the caller is using an invalid code.
    CString strProgramName = ResolveProgramName(strMnemonic);

    if (strProgramName.IsEmpty())
    {
        strErrorMessage.Format(
            _T("TME mnemonic '%s' is not registered in the routing table. ")
            _T("Verify the LSS001T entry on the Tandem backend."),
            strMnemonic.GetString());
        return FALSE;
    }

    // In production, strRequestData is serialised into a TME message buffer
    // and dispatched over the fgatetcp TLS 1.2 TCP connection to strProgramName
    // on the configured Tandem node. The response buffer is deserialised back
    // into strResponseData by the TME client library.
    //
    // This simulation returns a structured acknowledgement so downstream agents
    // can trace the mnemonic → program → response path without a live Tandem connection.

    strResponseData.Format(
        _T("TME-ACK|MNEMONIC=%s|PROGRAM=%s|STATUS=OK|DATA=%s"),
        strMnemonic.GetString(),
        strProgramName.GetString(),
        strRequestData.GetString());

    return TRUE;
}
