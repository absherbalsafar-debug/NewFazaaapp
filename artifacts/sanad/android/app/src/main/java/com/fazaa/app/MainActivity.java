package com.fazaa.app;

import android.app.AlertDialog;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
            return;
        }

        new AlertDialog.Builder(this)
            .setTitle("الخروج من فزعة")
            .setMessage("هل تريد الخروج من التطبيق؟")
            .setNegativeButton("إلغاء", null)
            .setPositiveButton("خروج", (dialog, which) -> finish())
            .show();
    }
}
