package com.fazaa.nativeapp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

// The Native client uses the same /api contract as the source web application.
class FazaaApi(private val baseUrl: String) {
    suspend fun categories(): List<Category> = get("/categories").let { body ->
        val array = if (body.trimStart().startsWith("[")) JSONArray(body) else JSONObject(body).optJSONArray("categories") ?: JSONArray()
        List(array.length()) { i -> array.getJSONObject(i).toCategory() }
    }

    suspend fun providers(search: String = "", city: String = "", categoryId: Int? = null): List<Provider> {
        val query = buildList { add("limit=30"); if (search.isNotBlank()) add("search=${enc(search)}"); if (city.isNotBlank()) add("city=${enc(city)}"); categoryId?.let { add("categoryId=$it") } }.joinToString("&")
        val body = get("/providers?$query")
        val array = JSONObject(body).optJSONArray("providers") ?: JSONArray(body)
        return List(array.length()) { i -> array.getJSONObject(i).toProvider() }
    }

    suspend fun provider(id: Int): Provider = JSONObject(get("/providers/$id")).toProvider()

    suspend fun login(phone: String, password: String): Session = JSONObject(post("/auth/login", JSONObject().put("phone", phone).put("password", password))).let {
        Session(it.getString("token"), it.getJSONObject("user").toUser())
    }

    private suspend fun get(path: String): String = call(path, "GET", null)
    private suspend fun post(path: String, body: JSONObject): String = call(path, "POST", body.toString())
    private suspend fun call(path: String, method: String, body: String?): String = withContext(Dispatchers.IO) {
        val conn = URL(baseUrl.trimEnd('/') + "/api" + path).openConnection() as HttpURLConnection
        conn.requestMethod = method; conn.connectTimeout = 15_000; conn.readTimeout = 20_000
        conn.setRequestProperty("Accept", "application/json")
        if (body != null) { conn.doOutput = true; conn.setRequestProperty("Content-Type", "application/json"); conn.outputStream.use { it.write(body.toByteArray()) } }
        val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
        val result = stream.bufferedReader().use { it.readText() }
        if (conn.responseCode !in 200..299) throw IllegalStateException(JSONObject(result).optString("error", "تعذر تنفيذ الطلب"))
        result
    }
    private fun enc(value: String) = java.net.URLEncoder.encode(value, Charsets.UTF_8.name())
}

data class Category(val id: Int, val name: String, val icon: String = "", val providerCount: Int = 0)
data class Provider(val id: Int, val name: String, val phone: String, val whatsapp: String?, val categoryName: String, val city: String, val district: String, val rating: Double, val reviewCount: Int, val yearsExperience: Int, val isVerified: Boolean, val bio: String?)
data class User(val id: Int, val name: String, val phone: String, val role: String)
data class Session(val token: String, val user: User)

private fun JSONObject.toCategory() = Category(optInt("id"), optString("name"), optString("icon"), optInt("providerCount"))
private fun JSONObject.toProvider() = Provider(optInt("id"), optString("name"), optString("phone"), optString("whatsapp").ifBlank { null }, optString("categoryName"), optString("city"), optString("district"), optDouble("rating"), optInt("reviewCount"), optInt("yearsExperience"), optBoolean("isVerified"), optString("bio").ifBlank { null })
private fun JSONObject.toUser() = User(optInt("id"), optString("name"), optString("phone"), optString("role"))
