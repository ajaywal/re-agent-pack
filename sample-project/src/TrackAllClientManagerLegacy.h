#pragma once

#include <afxwin.h>

class CTrackAllClientManagerLegacyApp : public CWinApp
{
public:
    virtual BOOL InitInstance();

    DECLARE_MESSAGE_MAP()
};

extern CTrackAllClientManagerLegacyApp theApp;
