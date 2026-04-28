#pragma once

#include <afx.h>
#include <map>

// CTMELibAdapter — TME framework interface for the TrackAll client-side stack.
//
// In production, outbound TME messages are sent over a TLS 1.2 TCP connection
// managed by fgatetcp. Each mnemonic is resolved to a Tandem server program
// name by looking up LSS001T at startup and caching the routing table locally.
// This adapter mirrors that pattern in memory so the rule-extractor and
// dependency-mapper agents can trace the full mnemonic → program path without
// a live Tandem environment.
//
// Supported mnemonics and their server programs:
//   LOAN_SEARCH    → TKA900   (loan record retrieval)
//   QUOTE_REQUEST  → TKARB000 (RataBase premium quote via Tandem bridge)
//   LOAN_UPDATE    → TKA910   (loan record update)
//   14E_NOTIFY     → TKA920   (14E outbound EDI notification trigger)

class CTMELibAdapter
{
public:
    CTMELibAdapter();

    // Send a message to the Tandem backend via the TME framework.
    // strMnemonic must exist in the routing table loaded from LSS001T.
    // Returns FALSE and populates strErrorMessage if the mnemonic is unknown
    // or the simulated gateway call fails.
    BOOL SendMessage(
        const CString& strMnemonic,
        const CString& strRequestData,
        CString& strResponseData,
        CString& strErrorMessage) const;

    // Returns the Tandem program name mapped to strMnemonic, or an empty string
    // if the mnemonic is not registered in the routing table.
    CString ResolveProgramName(const CString& strMnemonic) const;

private:
    void LoadRoutingTable();

private:
    // In-memory routing table: mnemonic → Tandem program name.
    // Populated in LoadRoutingTable() to mirror the LSS001T DB lookup.
    std::map<CString, CString> m_routingTable;
};
