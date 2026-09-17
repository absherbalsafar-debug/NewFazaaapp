package com.fazaa.app

import org.json.JSONObject

internal object RealClientApi : ClientApi {
    private fun provider(o: JSONObject) = ClientProvider(
        id = o.optInt("id"), name = o.optString("name", "مهني فزعة"), categoryName = o.optString("categoryName", "خدمات عامة"),
        categoryIcon = o.optString("categoryIcon", "🔧"), city = o.optString("city", "صنعاء"), district = o.optString("district"),
        bio = o.optString("bio"), rating = o.optDouble("rating", 0.0), reviewCount = o.optInt("reviewCount"), completedJobs = o.optInt("completedJobs"),
        yearsExperience = o.optInt("yearsExperience"), isVerified = o.optBoolean("isVerified"), isAvailable = o.optBoolean("isAvailable"),
        isFavorited = o.optBoolean("isFavorited"), phone = o.optString("phone").takeIf { it.isNotBlank() }, whatsapp = o.optString("whatsapp").takeIf { it.isNotBlank() }
    )
    private fun category(o: JSONObject) = ClientCategory(o.optInt("id"), o.optString("name"), o.optString("icon", "🔧"))
    private fun request(o: JSONObject) = ClientRequest(o.optInt("id"), o.optString("serviceType"), o.optString("description"), o.optString("city", "صنعاء"), o.optString("district"), o.optString("status", "pending"), o.optBoolean("isImmediate", true), o.optString("scheduledAt").takeIf { it.isNotBlank() }, o.optString("createdAt"), o.optString("providerName", "بانتظار المهني"), o.optString("providerCategoryName"))

    override suspend fun home(): ClientHomeData {
        val root = ApiClient.request("/home-feed")
        val cats = root.optJSONArray("categories") ?: org.json.JSONArray()
        val top = root.optJSONArray("topRatedProviders") ?: org.json.JSONArray()
        val recent = root.optJSONArray("recentRequests") ?: org.json.JSONArray()
        return ClientHomeData((0 until cats.length()).map { category(cats.getJSONObject(it)) }, (0 until top.length()).map { provider(top.getJSONObject(it)) }, (0 until recent.length()).map { request(recent.getJSONObject(it)) })
    }

    override suspend fun discover(): ClientDiscoverData {
        val data = home()
        return ClientDiscoverData(data.categories, data.featured, data.featured)
    }

    override suspend fun providers(query: ProviderQuery): List<ClientProvider> {
        val params = buildString { if (query.search.isNotBlank()) append("&search=${java.net.URLEncoder.encode(query.search, "UTF-8")}"); if (query.categoryId != null) append("&categoryId=${query.categoryId}"); if (query.city.isNotBlank()) append("&city=${java.net.URLEncoder.encode(query.city, "UTF-8")}") }
        val root = ApiClient.request("/providers?page=1&limit=50$params")
        val rows = root.optJSONArray("providers") ?: org.json.JSONArray()
        return (0 until rows.length()).map { provider(rows.getJSONObject(it)) }
    }
    override suspend fun provider(id: Int): ClientProvider? = provider(ApiClient.request("/providers/$id"))
    override suspend fun reviews(providerId: Int): List<ClientReview> = emptyList()
    override suspend fun portfolio(providerId: Int): List<ClientPortfolioItem> {
        val rows = ApiClient.requestArray("/providers/$providerId/portfolio")
        return (0 until rows.length()).map { val o = rows.getJSONObject(it); ClientPortfolioItem(o.optInt("id"), o.optString("description")) }
    }
    override suspend fun createRequest(request: NewClientRequest): ClientRequest = request(ApiClient.request("/requests", "POST", JSONObject().put("providerId", request.providerId).put("serviceType", request.serviceType).put("description", request.description).put("city", request.city).put("district", request.district).put("isImmediate", request.isImmediate).put("scheduledAt", request.scheduledAt)))
    override suspend fun requests(): List<ClientRequest> = listRequests(ApiClient.requestArray("/requests"))
    override suspend fun request(id: Int): ClientRequest? = request(ApiClient.request("/requests/$id"))
    override suspend fun updateRequestStatus(id: Int, status: String): ClientRequest = request(ApiClient.request("/requests/$id", "PATCH", JSONObject().put("status", status)))
    override suspend fun favorites(): List<ClientProvider> { val rows = ApiClient.requestArray("/favorites"); return (0 until rows.length()).map { provider(rows.getJSONObject(it)) } }
    override suspend fun setFavorite(providerId: Int, favorite: Boolean) { if (favorite) ApiClient.request("/favorites/$providerId", "POST") else ApiClient.request("/favorites/$providerId", "DELETE") }
    override suspend fun trackContact(providerId: Int, kind: String) { ApiClient.request("/providers/$providerId/contact-click", "POST", JSONObject().put("kind", kind)) }
    override suspend fun notifications(): List<ClientNotification> { val rows = ApiClient.requestArray("/notifications"); return (0 until rows.length()).map { val o = rows.getJSONObject(it); ClientNotification(o.optInt("id"), o.optString("title"), o.optString("body"), o.optString("createdAt"), o.optBoolean("isRead")) } }
    override suspend fun markAllNotificationsRead() { ApiClient.request("/notifications", "PATCH") }

    private fun listRequests(rows: org.json.JSONArray) = (0 until rows.length()).map { request(rows.getJSONObject(it)) }
}
