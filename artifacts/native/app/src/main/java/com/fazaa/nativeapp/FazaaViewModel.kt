package com.fazaa.nativeapp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface LoadState { data object Loading : LoadState; data class Ready(val providers: List<Provider>, val categories: List<Category>) : LoadState; data class Error(val message: String) : LoadState }

class FazaaViewModel : ViewModel() {
    // Replace with the deployed API URL per environment; never use mock data.
    private val api = FazaaApi(BuildConfig.API_BASE_URL)
    private val _state = MutableStateFlow<LoadState>(LoadState.Loading)
    val state: StateFlow<LoadState> = _state.asStateFlow()
    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()
    var selected: Provider? = null

    init { refresh() }
    fun refresh(search: String = "", city: String = "", categoryId: Int? = null) = viewModelScope.launch {
        _state.value = LoadState.Loading
        runCatching { api.categories() to api.providers(search, city, categoryId) }
            .onSuccess { (cats, providers) -> _state.value = LoadState.Ready(providers, cats) }
            .onFailure { _state.value = LoadState.Error(it.message ?: "تعذر تحميل البيانات") }
    }
    fun login(phone: String, password: String, onResult: (String?) -> Unit) = viewModelScope.launch {
        runCatching { api.login(phone, password) }.onSuccess { session -> _user.value = session.user; onResult(null) }.onFailure { onResult(it.message) }
    }
    fun logout() { _user.value = null }
}
