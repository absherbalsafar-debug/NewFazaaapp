package com.fazaa.app

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object ApiClient {
    const val BASE_URL = "https://8090-iuv0tmzqwpojlvc3pkhoo-3c42ac26.us4.manus.computer/api"
    private val client = OkHttpClient()
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    @Volatile private var authToken: String? = null
    private var preferences: android.content.SharedPreferences? = null

    data class OtpResult(val otp: String?, val message: String)
    data class VerifyResult(val token: String?, val needsRegistration: Boolean, val error: String? = null)

    fun initialize(context: Context) {
        preferences = context.getSharedPreferences("fazaa_auth", Context.MODE_PRIVATE)
        authToken = preferences?.getString("token", null)
    }

    fun setToken(token: String?) {
        authToken = token
        preferences?.edit()?.putString("token", token)?.apply() ?: preferences?.edit()?.remove("token")?.apply()
    }

    suspend fun request(path: String, method: String = "GET", payload: JSONObject? = null): JSONObject = withContext(Dispatchers.IO) {
        val builder = Request.Builder().url(BASE_URL.trimEnd('/') + path)
            .header("Accept", "application/json")
        authToken?.let { builder.header("Authorization", "Bearer $it") }
        if (method != "GET") builder.method(method, (payload ?: JSONObject()).toString().toRequestBody(jsonType))
        client.newCall(builder.build()).execute().use { response ->
            val body = response.body?.string().orEmpty()
            val json = runCatching { JSONObject(body) }.getOrElse {
                throw IllegalStateException("خادم فزعة أعاد استجابة غير صالحة (${response.code})")
            }
            if (!response.isSuccessful) throw IllegalStateException(json.optString("error", "تعذر تنفيذ الطلب (${response.code})"))
            json
        }
    }

    suspend fun requestArray(path: String, method: String = "GET", payload: JSONObject? = null): org.json.JSONArray = withContext(Dispatchers.IO) {
        val builder = Request.Builder().url(BASE_URL.trimEnd('/') + path).header("Accept", "application/json")
        authToken?.let { builder.header("Authorization", "Bearer $it") }
        if (method != "GET") builder.method(method, (payload ?: JSONObject()).toString().toRequestBody(jsonType))
        client.newCall(builder.build()).execute().use { response ->
            val body = response.body?.string().orEmpty()
            val json = runCatching { org.json.JSONArray(body) }.getOrElse { throw IllegalStateException("استجابة API غير صالحة (${response.code})") }
            if (!response.isSuccessful) throw IllegalStateException("تعذر تنفيذ الطلب (${response.code})")
            json
        }
    }

    suspend fun sendOtp(phone: String): OtpResult {
        val result = request("/auth/send-otp", "POST", JSONObject().put("phone", phone.trim()))
        return OtpResult(result.optString("otp").takeIf { it.isNotBlank() }, result.optString("message", "تم إرسال رمز التحقق"))
    }

    suspend fun verifyOtp(phone: String, code: String, name: String? = null, role: String = "client"): VerifyResult {
        val payload = JSONObject().put("phone", phone.trim()).put("code", code)
        if (!name.isNullOrBlank()) payload.put("name", name.trim()).put("role", role)
        val result = request("/auth/verify-otp", "POST", payload)
        val token = result.optString("token").takeIf { it.isNotBlank() }
        if (token != null) setToken(token)
        return VerifyResult(token, result.optBoolean("needsRegistration", false))
    }
}
