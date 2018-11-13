using Microsoft.Win32;
using SHDocVw;
using System;
using System.Runtime.InteropServices;
using mshtml;
using System.Net;
using System.Diagnostics;
using System.Collections.Generic;
using CloudBeat.IEAddon.Properties;

namespace CloudBeat.IEAddon
{
	  [ComVisible(true)]
	  [ClassInterface(ClassInterfaceType.None)]
    [Guid("D8FAF7A1-1D88-11E2-AE2C-001C230C8ABD")]
	  [ProgId("Oxygen")]
    public class RecorderExtension : IObjectWithSite, IOleCommandTarget, DWebBrowserEvents
    {
        private const string IDE_ADDR = "http://localhost:7778/";

        IWebBrowser2 browser;
        HashSet<string> seenPages = new HashSet<string>();

        #region
		    private void InjectScriptToHead(HTMLDocument doc, string script)
		    {
			    IHTMLDOMNode head = (IHTMLDOMNode)doc.getElementsByTagName("head").item(0);
			    IHTMLScriptElement scriptEl = (IHTMLScriptElement)doc.createElement("script");
			    scriptEl.type = "text/javascript";
			    scriptEl.text = script;
			    head.appendChild((IHTMLDOMNode)scriptEl);
		    }

        public bool IsSupportedURL(string url) 
        {
            if (url.StartsWith("about:") ||                 // ignore misc windows which don't need to be recorded
                url == "" ||
                url.StartsWith("javascript:") ||
                url.StartsWith("http://googleads.") ||      // ignore google ads frames just for better perfomance since users wouldn't want to record them anyway
                url.StartsWith("https://googleads."))       
                return false;

            return true;
        }

        public void OnDownloadBegin()
        {
            if (!IsSupportedURL(browser.LocationURL))
                return;

            HTMLDocument doc = browser.Document as HTMLDocument;
            if (doc.readyState == "loading")
            {
                // if the page has been seen already and tries to load again -
                // the window was refreshed and we'll need to inject all the scripts again
                seenPages.Remove(browser.LocationURL);
            }
        }

        public void OnDownloadComplete()
        {
            if (!IsSupportedURL(browser.LocationURL))
                return;

            HTMLDocument doc = browser.Document as HTMLDocument;

            if (doc.readyState == "loading")
            {
                seenPages.Remove(browser.LocationURL);
            }
            else if (doc.readyState == "interactive")
            {
                if (seenPages.Contains(browser.LocationURL))
                    return;

                try
                {
                    InjectScriptToHead(doc, Resources.recorder);
                    seenPages.Add(doc.url);
                }
                catch (Exception)
                { // suppress exceptions
                }
            }
        }

        public void OnDocumentComplete(object pDisp, ref object URL) {
            var browser = pDisp as IWebBrowser2;
            if (browser == null)
                return;

            if (!IsSupportedURL(browser.LocationURL))
                return;

            if (seenPages.Contains(browser.LocationURL))
                return;

            HTMLDocument doc = (HTMLDocument)browser.Document;
            try
            {
                InjectScriptToHead(doc, Resources.recorder);
                seenPages.Add(doc.url);
            }
            catch (Exception)
            { // suppress exceptions
            }
        }
        #endregion

        private int cookie = -1;
#pragma warning disable 618
        private UCOMIConnectionPoint icp;
#pragma warning restore 618

        #region Implementation of IObjectWithSite
        int IObjectWithSite.SetSite(object site)
        {
#if DEBUG
            // launch debugger when in Debug build
            Debugger.Launch();
#endif

            if (site != null)
            {
                browser = (IWebBrowser2)site;

                // can't simply subscribe to OnBeforeNavigate2 from .NET - https://support.microsoft.com/en-us/kb/325079?wa=wsignin1.0
#pragma warning disable 618
                UCOMIConnectionPointContainer icpc = (UCOMIConnectionPointContainer)site;
#pragma warning restore 618
                Guid g = typeof(DWebBrowserEvents).GUID;
                icpc.FindConnectionPoint(ref g, out icp);
                icp.Advise(this, out cookie);

                ((DWebBrowserEvents2_Event)browser).DocumentComplete += new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
                ((DWebBrowserEvents2_Event)browser).DownloadBegin += new DWebBrowserEvents2_DownloadBeginEventHandler(this.OnDownloadBegin);
                ((DWebBrowserEvents2_Event)browser).DownloadComplete += new DWebBrowserEvents2_DownloadCompleteEventHandler(this.OnDownloadComplete);
            }
            else
            {
                icp.Unadvise(cookie);

                ((DWebBrowserEvents2_Event)browser).DocumentComplete -= new DWebBrowserEvents2_DocumentCompleteEventHandler(this.OnDocumentComplete);
                ((DWebBrowserEvents2_Event)browser).DownloadComplete -= new DWebBrowserEvents2_DownloadCompleteEventHandler(this.OnDownloadComplete);

                browser = null;
            }
            return 0;
        }

        int IObjectWithSite.GetSite(ref Guid guid, out IntPtr ppvSite)
        {
            IntPtr punk = Marshal.GetIUnknownForObject(browser);
            int hr = Marshal.QueryInterface(punk, ref guid, out ppvSite);
            Marshal.Release(punk);
            return hr;
        }
        #endregion
        #region Implementation of IOleCommandTarget
        int IOleCommandTarget.QueryStatus(IntPtr pguidCmdGroup, uint cCmds, ref OLECMD prgCmds, IntPtr pCmdText)
        {
            return 0;
        }

        int IOleCommandTarget.Exec(IntPtr pguidCmdGroup, uint nCmdID, uint nCmdexecopt, IntPtr pvaIn, IntPtr pvaOut)
        {
            return 0;
        }
        #endregion

        #region Register/Unregister
        public static string RegBHO = "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Browser Helper Objects";

        [ComRegisterFunction]
        public static void RegisterBHO(Type type)
        {
            string guid = type.GUID.ToString("B");
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(RegBHO, true);
            if (registryKey == null)
                registryKey = Registry.LocalMachine.CreateSubKey(RegBHO);
            RegistryKey key = registryKey.OpenSubKey(guid);
            if (key == null)
                key = registryKey.CreateSubKey(guid);
            key.SetValue("", "Oxygen");
            key.SetValue("NoExplorer", 1);
            registryKey.Close();
            key.Close();

            // name to display in the addons management screen
            using (key = Registry.ClassesRoot.CreateSubKey("CLSID\\" + type.GUID.ToString("B")))
            {
                key.SetValue(string.Empty, "Oxygen");
            }
        }

        [ComUnregisterFunction]
        public static void UnregisterBHO(Type type)
        {
            string guid = type.GUID.ToString("B");
            RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(RegBHO, true);
            if (registryKey != null)
                registryKey.DeleteSubKey(guid, false);
        }
        #endregion

        #region Implementation of DWebBrowserEvents
        public void BeforeNavigate(string url, int flags, string targetFrameName,
        ref object postData, string headers, ref bool cancel)
        {
            // try to determine navigation type using undocumented flags:

            // IE 11 x86 (tested on Win 7 x86, Server 2012 R2 x64)
            //      256 - typing in the address bar or opening a bookmark
            //      320 - link click, back/forward navigation
            // IE 10 x86 (tested on Win 8 x86)
            //        0 - typing in the address bar or opening a bookmark
            //       64 - link click, back/forward navigation
            if ((flags != 256 && flags != 0) ||
                url == "about:Tabs" || url == "about:blank" ||
                targetFrameName != "")    // don't generate open cmd for popup windows
                return;

            try
            {
                using (var client = new WebClient())
                {
                    client.Headers[HttpRequestHeader.ContentType] = "application/x-www-form-urlencoded";
                    const string CMD_OPEN_TMPL = "[{{\"module\":\"web\",\"cmd\":\"open\",\"target\":\"{0}\",\"timestamp\":{1}}}]";
                    var cmd = string.Format(CMD_OPEN_TMPL, url, (Int32)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds);
                    var result = client.UploadString(IDE_ADDR, "POST", cmd);
                }
            } 
            catch (Exception) 
            {
                // fail silently
            }
        }

        public void PropertyChange(string Property) { }

        public void NavigateComplete(string URL) { }

        public void WindowActivate() { }

        public void FrameBeforeNavigate(string URL, int Flags, string TargetFrameName, ref object PostData, string Headers, ref bool Cancel) { }

        public void NewWindow(string URL, int Flags, string TargetFrameName, ref object PostData, string Headers, ref bool Processed) { }

        public void FrameNewWindow(string URL, int Flags, string TargetFrameName, ref object PostData, string Headers, ref bool Processed) { }

        public void TitleChange(string Text) { }

        public void DownloadBegin() { }

        public void DownloadComplete() { }

        public void WindowMove() { }

        public void WindowResize() { }

        public void Quit(ref bool Cancel) { }

        public void ProgressChange(int Progress, int ProgressMax) { }

        public void StatusTextChange(string Text) { }

        public void CommandStateChange(int Command, bool Enable) { }

        public void FrameNavigateComplete(string URL) { }
        #endregion
    }
}
