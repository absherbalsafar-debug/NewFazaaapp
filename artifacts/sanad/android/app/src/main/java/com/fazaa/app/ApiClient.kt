package com.fazaa.app

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object ApiClient {
    // Temporary public deployment of the real Fazaa API from this repository.
    const val BASE_URL = "https://8090-iuv0tmzqwpojlvc3pkhoo-3c42ac26.us4.manus.computer/api"
    private val client = OkHttpClient()
    private val jsonType = "application/json; charset=utf-8".toMediaType()

    data class OtpResult(val otp: String?, val message: String)
    data class VerifyResult(val token: String?, val needsRegistration: Boolean, val error: String? = null)

    private suspend fun post(path: String, payload: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(BASE_URL.trimEnd('/') + path)
            .post(payload.toString().toRequestBody(jsonType))
            .build()
        client.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                val error = runCatching { JSONObject(body).optString("error") }.getOrNull()
                throw IllegalStateException(error?.takeIf { it.isNotBlank() } ?: "تعذر الاتصال بخادم فزعة (${response.code})")
            }
            if (!body.trimStart().startsWith("{")) {
                throw IllegalStateException("عنوان خادم API غير صحيح أو غير جاهز. تلقى التطبيق صفحة ويب بدلاً من استجابة API.")
            }
            JSONObject(body)
        }
    }

    suspend fun sendOtp(phone: String): OtpResult {
        val result = post("/auth/send-otp", JSONObject().put("phone", phone.trim()))
        return OtpResult(result.optString("otp").takeIf { it.isNotBlank() }, result.optString("message", "تم إرسال رمز التحقق"))
    }

    suspend fun verifyOtp(phone: String, code: String, name: String? = null, role: String = "client"): VerifyResult {
        val payload = JSONObject().put("phone", phone.trim()).put("code", code)
        if (!name.isNullOrBlank()) payload.put("name", name.trim()).put("role", role)
        val result = post("/auth/verify-otp", payload)
        return VerifyResult(result.optString("token").takeIf { it.isNotBlank() }, result.optBoolean("needsRegistration", false))
    }
}
