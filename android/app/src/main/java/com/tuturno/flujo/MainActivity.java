package com.tuturno.flujo;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.util.Log;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/** Contenedor Android del mismo flujo web, con recursos locales y sin Expo. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView webView;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(0, 35, 209));
        getWindow().setNavigationBarColor(Color.rgb(0, 35, 209));
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(0, 35, 209));
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets keyboard = insets.getInsets(WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
                return insets;
            });
        } else {
            root.setFitsSystemWindows(true);
        }
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(0, 35, 209));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        root.requestApplyInsets();
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/app/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                if (!request.isForMainFrame()) return true;
                String scheme = uri.getScheme();
                if ("https".equals(scheme) || "mailto".equals(scheme) || "tel".equals(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException error) { Toast.makeText(MainActivity.this, "No hay una aplicación disponible para abrir este enlace.", Toast.LENGTH_LONG).show(); }
                }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage message) {
                if (BuildConfig.DEBUG) Log.d("TuTurnoWeb", message.message());
                return true;
            }
        });
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::goBack);
        if (savedInstanceState == null) openFlow(getIntent());
        else webView.restoreState(savedInstanceState);
    }

    /** Permite revisar una pantalla concreta desde adb sin cambiar el recorrido normal. */
    private void openFlow(Intent intent) {
        Uri.Builder url = Uri.parse("https://" + HOST + "/app/index.html").buildUpon().appendQueryParameter("android", "1");
        String screen = intent.getStringExtra("pantalla");
        if (screen != null && screen.matches("1[0-3][bcd]?|[1-9][abc]?")) url.appendQueryParameter("screen", screen);
        String variant = intent.getStringExtra("variante");
        if (variant != null && variant.matches("base|other|guide[23]?|selected|ready|wheel7")) url.appendQueryParameter("variant", variant);
        webView.loadUrl(url.build().toString());
    }
    @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); openFlow(intent); }
    @Override protected void onSaveInstanceState(Bundle out) { webView.saveState(out); super.onSaveInstanceState(out); }
    @Override protected void onPause() { webView.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override public void onBackPressed() { goBack(); }
    private void goBack() {
        webView.evaluateJavascript("(()=>{const b=document.querySelector('[aria-label=\"Cerrar\"]')||document.querySelector('[aria-label=\"Volver\"]');if(b){b.click();return true}return false})()",
            handled -> { if (!"true".equals(handled)) finish(); });
    }
    @Override protected void onDestroy() { if (webView != null) { webView.stopLoading(); webView.destroy(); } super.onDestroy(); }
}
