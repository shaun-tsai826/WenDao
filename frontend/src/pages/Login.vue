<!--
  登入頁（task 5.2，AC-1.1、AC-1.2）
  設計：design.md「UI 設計規範」＋ 設計稿 B 登入頁（使用者 2026-11-02 確認）
  - 支援密碼管理工具自動填入（autocomplete）、可切換顯示密碼
  - 登入中按鈕停用並顯示「登入中…」；錯誤訊息用 role="alert"
  - 登入頁不在 MainLayout 裡，不使用 q-page
-->
<template>
  <div class="login">
    <div class="login__brand">
      <BrandLogo class="login__mark" />
      <span class="login__name">{{ APP_NAME }}</span>
      <span class="login__tagline">家裡用品的購買記錄與補貨提醒</span>
    </div>

    <main class="login__card">
      <h1 class="login__title">登入</h1>

      <form class="login__form" novalidate @submit.prevent="submit">
        <div class="field">
          <label for="login-email" class="field__label">Email</label>
          <input
            id="login-email"
            ref="emailInput"
            v-model="email"
            type="email"
            name="email"
            autocomplete="username"
            inputmode="email"
            class="field__input"
            :aria-invalid="emailError ? 'true' : undefined"
            :aria-describedby="emailError ? 'login-email-error' : undefined"
          />
          <span v-if="emailError" id="login-email-error" class="field__error">{{
            emailError
          }}</span>
        </div>

        <div class="field">
          <label for="login-password" class="field__label">密碼</label>
          <div class="field__box">
            <input
              id="login-password"
              ref="passwordInput"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              class="field__input field__input--bare"
              :aria-invalid="passwordError ? 'true' : undefined"
              :aria-describedby="passwordError ? 'login-password-error' : undefined"
            />
            <button
              type="button"
              class="field__toggle"
              :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="20" />
            </button>
          </div>
          <span v-if="passwordError" id="login-password-error" class="field__error">
            {{ passwordError }}
          </span>
        </div>

        <div v-if="formError" role="alert" class="login__alert">
          <AppIcon name="alert" :size="18" />
          <span>{{ formError }}</span>
        </div>

        <button type="submit" class="login__submit" :disabled="loading">
          {{ loading ? '登入中…' : '登入' }}
        </button>
      </form>
    </main>

    <p class="login__note">帳號由家裡的管理員建立；忘記密碼請找管理員重設</p>
  </div>
</template>

<script setup lang="ts">
import { APP_NAME } from '@/constants/app';
import { nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import BrandLogo from '@/components/BrandLogo.vue';
import { ERR } from '@/constants/messages';
import { loginErrorMessage, useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const emailError = ref('');
const passwordError = ref('');
const formError = ref('');
const emailInput = ref<HTMLInputElement | null>(null);
const passwordInput = ref<HTMLInputElement | null>(null);

async function submit() {
  if (loading.value) return;
  formError.value = '';
  emailError.value = email.value.trim() ? '' : ERR.required;
  passwordError.value = password.value ? '' : ERR.required;
  if (emailError.value || passwordError.value) {
    (emailError.value ? emailInput : passwordInput).value?.focus();
    return;
  }

  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    await router.replace('/'); // 登入成功導向首頁（AC-1.1）
  } catch (err) {
    formError.value = loginErrorMessage(err); // 帳密錯誤 → ERR-001（AC-1.2）
    password.value = ''; // 保留 email、清空密碼
    await nextTick();
    passwordInput.value?.focus();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  max-width: 420px;
  margin: 0 auto;
  padding: 32px var(--page-margin) 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 28px;
}

// 門牌 Logo（寬高比 140:96）
.login__mark {
  width: 94px;
  height: 64px;
  margin-bottom: 8px;
}

.login__name {
  font-size: 26px;
}

.login__tagline {
  font-size: 14px;
  color: var(--muted);
}

.login__card {
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: 20px var(--card-pad);
}

.login__title {
  margin: 0 0 16px;
  font-size: 20px;
  line-height: 1.3;
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__label {
  font-size: 14px;
}

.field__input {
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 12px;
  font: inherit;
  font-size: 16px; // 16px 以上，iPhone 點欄位時不會自動放大畫面
  color: var(--text);
  background: var(--surface);
  outline: none;

  &:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  &[aria-invalid='true'] {
    border-color: var(--status-depleted-ink);
  }
}

.field__box {
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  padding-left: 12px;
  background: var(--surface);

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  &:has([aria-invalid='true']) {
    border-color: var(--status-depleted-ink);
  }
}

.field__input--bare {
  flex: 1 1 auto;
  min-width: 0;
  height: 44px;
  border: none;
  padding: 0;
  background: transparent;

  &:focus-visible {
    box-shadow: none;
  }
}

.field__toggle {
  flex: none;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -4px;
  }
}

.field__error {
  font-size: 13px;
  color: var(--status-depleted-ink);
}

.login__alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-inner);
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
  font-size: 14px;
  line-height: 1.5;

  svg {
    flex: none;
    margin-top: 1px;
  }
}

.login__submit {
  height: 50px;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #ffffff;
  font: inherit;
  font-size: 16px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--accent-ink);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
}

.login__note {
  margin: 16px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}
</style>
