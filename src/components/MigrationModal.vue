<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import {
    IconExternalLink,
    IconX,
    IconCheck,
    IconLayersLinked,
    IconArrowRight,
    IconShieldCheck,
    IconFileText,
    IconCopy,
    IconBuildingStore,
    IconArrowDown,
    IconBug,
} from "@tabler/icons-vue";
import { MANKSI_APP_URL } from "@/config/appConfig";
import { showSuccessToast } from "@/utils/toast";

const props = defineProps<{
    modelValue: boolean;
    featureName?: string;
    sourceMenu?: string;
    targetLocation?: string;
    targetPath?: string;
    localPath?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => {
    const kode = String(authStore.user?.kode || "")
        .trim()
        .toUpperCase();
    return kode === "ADMIN";
});

const isCopied = ref(false);

const fullTargetUrl = computed(() => {
    const base = MANKSI_APP_URL.replace(/\/+$/, "");
    const path = (props.targetPath || "/").startsWith("/")
        ? props.targetPath || "/"
        : `/${props.targetPath || ""}`;
    return `${base}${path}`;
});

const close = () => {
    emit("update:modelValue", false);
};

const openInManksi = () => {
    window.open(fullTargetUrl.value, "_blank", "noopener,noreferrer");
    close();
};

const openInMmt = () => {
    close();
    if (props.localPath) {
        router.push(props.localPath);
    }
};

const copyLink = async () => {
    try {
        await navigator.clipboard.writeText(fullTargetUrl.value);
        isCopied.value = true;
        showSuccessToast("Tautan Manksi berhasil disalin ke clipboard!");
        setTimeout(() => {
            isCopied.value = false;
        }, 2500);
    } catch (err) {
        console.error("Gagal menyalin link:", err);
    }
};
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        max-width="640px"
        scrollable
        transition="dialog-transition"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <div class="modal-card-wrapper">
            <!-- Modal Header -->
            <div class="modal-header">
                <div class="header-left">
                    <div class="header-icon-box">
                        <IconLayersLinked :size="18" class="text-white" />
                    </div>
                    <div>
                        <h3 class="header-title">Migrasi Sistem</h3>
                        <p class="header-subtitle">
                            Migrasi sistem MMT ke Sistem Manksi
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    class="modal-close-btn"
                    title="Tutup dialog"
                    @click="close"
                >
                    <IconX :size="20" />
                </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
                <!-- Main Intro Callout -->
                <div class="intro-callout">
                    <div class="intro-avatar">
                        <IconBuildingStore :size="26" class="text-blue-600" />
                    </div>
                    <div class="intro-content">
                        <div class="intro-badge">STANDARISASI SISTEM</div>
                        <h2 class="intro-title">
                            {{ featureName || "Memo Approval Produk (MAP)" }}
                        </h2>
                        <p class="intro-desc">
                            Menu ini telah dialihkan dan disatukan ke sistem
                            <b>Manksi</b>.
                        </p>
                    </div>
                </div>

                <!-- Route Comparison Stepper Box -->
                <div class="route-box">
                    <div class="route-item source-item">
                        <div class="route-header">
                            <span class="route-tag tag-source"
                                >MENU LAMA (MMT)</span
                            >
                        </div>
                        <div class="route-path source-path">
                            {{
                                sourceMenu ||
                                "Produksi MMT > Memo Approval Produk (MAP)"
                            }}
                        </div>
                    </div>

                    <div class="route-divider">
                        <div class="divider-line"></div>
                        <div class="divider-badge">
                            <IconArrowDown :size="14" class="inline mr-1" />
                            Dialihkan ke lokasi baru
                        </div>
                        <div class="divider-line"></div>
                    </div>

                    <div class="route-item target-item">
                        <div class="route-header">
                            <span class="route-tag tag-target"
                                >MENU MIGRASI (MANKSI)</span
                            >
                        </div>
                        <div class="route-path target-path">
                            {{ targetLocation }}
                        </div>
                    </div>
                </div>

                <!-- 3 Feature Highlight Cards -->
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon icon-shield">
                            <IconShieldCheck :size="20" />
                        </div>
                        <div class="feature-text">
                            <span class="feature-name">Akun Terhubung</span>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon icon-file">
                            <IconFileText :size="20" />
                        </div>
                        <div class="feature-text">
                            <span class="feature-name"
                                >Data & Riwayat Aman</span
                            >
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon icon-layers">
                            <IconLayersLinked :size="20" />
                        </div>
                        <div class="feature-text">
                            <span class="feature-name">Lintas Divisi</span>
                        </div>
                    </div>
                </div>

                <!-- Admin Debug Notice -->
                <div v-if="isAdmin && localPath" class="admin-debug-box">
                    <div class="admin-debug-badge">
                        <IconBug :size="14" class="mr-1" />
                        KHUSUS ADMIN (DEBUG & KOMPARASI)
                    </div>
                    <p class="admin-debug-text">
                        Source code lokal masih tersedia di route
                        <code>{{ localPath }}</code
                        >. Anda dapat membuka versi lokal MMT atau lanjut ke
                        sistem Manksi.
                    </p>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn-copy-link"
                    title="Salin tautan langsung ke clipboard"
                    @click="copyLink"
                >
                    <component
                        :is="isCopied ? IconCheck : IconCopy"
                        :size="15"
                    />
                    <span>{{ isCopied ? "Tersalin!" : "Salin Tautan" }}</span>
                </button>

                <div class="footer-actions-right">
                    <button type="button" class="btn-cancel" @click="close">
                        Tutup
                    </button>
                    <button
                        v-if="isAdmin && localPath"
                        type="button"
                        class="btn-open-mmt"
                        title="Buka halaman lokal MMT untuk debug dan komparasi"
                        @click="openInMmt"
                    >
                        <IconBug :size="16" />
                        <span>Buka di MMT (Debug)</span>
                    </button>
                    <button
                        type="button"
                        class="btn-open-manksi"
                        @click="openInManksi"
                    >
                        <span>Buka di Sistem Manksi</span>
                        <IconExternalLink :size="16" />
                    </button>
                </div>
            </div>
        </div>
    </v-dialog>
</template>

<style scoped>
.modal-card-wrapper {
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
    border: 1px solid rgba(226, 232, 240, 0.9);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 48px);
}

/* Header */
.modal-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}

.header-title {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    line-height: 1.25;
}

.header-subtitle {
    font-size: 12px;
    color: #94a3b8;
    margin: 2px 0 0 0;
    line-height: 1.2;
}

.modal-close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #94a3b8;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
}

.modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
}

/* Body */
.modal-body {
    padding: 20px 24px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    flex: 1;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}

.modal-body::-webkit-scrollbar {
    width: 6px;
}

.modal-body::-webkit-scrollbar-track {
    background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 6px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
}

/* Intro Callout */
.intro-callout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px 18px;
}

.intro-avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.intro-content {
    flex: 1;
}

.intro-badge {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.8px;
    color: #2563eb;
    margin-bottom: 2px;
}

.intro-title {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 4px 0;
    line-height: 1.3;
}

.intro-desc {
    font-size: 12.5px;
    color: #475569;
    line-height: 1.5;
    margin: 0;
}

/* Route Box */
.route-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.route-item {
    border-radius: 10px;
    padding: 12px 14px;
}

.source-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
}

.target-item {
    background: linear-gradient(135deg, #eff6ff 0%, #f0f7ff 100%);
    border: 1.5px solid #93c5fd;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
}

.route-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.route-tag {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.6px;
    padding: 2px 8px;
    border-radius: 6px;
    display: inline-block;
}

.tag-source {
    background: #e2e8f0;
    color: #475569;
}

.tag-target {
    background: #2563eb;
    color: #ffffff;
}

.route-url-pill {
    font-size: 11px;
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #1e40af;
    background: #dbeafe;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 600;
}

.route-path {
    font-size: 13.5px;
    line-height: 1.4;
    word-break: break-word;
}

.source-path {
    color: #475569;
    font-weight: 500;
}

.target-path {
    color: #1e3a8a;
    font-weight: 700;
}

/* Route Divider */
.route-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: -2px 0;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
}

.divider-badge {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    background: #f1f5f9;
    padding: 3px 10px;
    border-radius: 9999px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
}

/* 3-Feature Grid */
.features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.feature-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.feature-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-shield {
    background: #dcfce7;
    color: #15803d;
}

.icon-file {
    background: #e0e7ff;
    color: #4338ca;
}

.icon-layers {
    background: #fef3c7;
    color: #b45309;
}

.feature-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.feature-name {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
}

.feature-desc {
    font-size: 11px;
    color: #64748b;
    line-height: 1.35;
}

/* Footer */
.modal-footer {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.btn-copy-link {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.btn-copy-link:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    color: #1e293b;
}

.footer-actions-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn-cancel {
    background: transparent;
    border: 1px solid transparent;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    padding: 9px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.btn-cancel:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.btn-open-manksi {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    border: none;
    color: #ffffff;
    font-size: 13.5px;
    font-weight: 700;
    padding: 10px 20px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    transition: all 0.15s ease;
}

.btn-open-manksi:hover {
    background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
}

.btn-open-mmt {
    background: #fff7ed;
    border: 1.5px solid #f97316;
    color: #c2410c;
    font-size: 13px;
    font-weight: 700;
    padding: 9px 16px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.btn-open-mmt:hover {
    background: #ffedd5;
    border-color: #ea580c;
    color: #9a3412;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
}

.admin-debug-box {
    background: #fffbeb;
    border: 1px dashed #f59e0b;
    border-radius: 12px;
    padding: 10px 14px;
    margin-top: 12px;
}

.admin-debug-badge {
    display: inline-flex;
    align-items: center;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #b45309;
    margin-bottom: 4px;
}

.admin-debug-text {
    font-size: 12px;
    color: #78350f;
    line-height: 1.4;
    margin: 0;
}

.admin-debug-text code {
    background: #fef3c7;
    padding: 1px 6px;
    border-radius: 4px;
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    color: #92400e;
}

@media (max-width: 640px) {
    .modal-body {
        padding: 16px;
        gap: 16px;
    }
    .features-grid {
        grid-template-columns: 1fr;
    }
    .modal-footer {
        flex-direction: column-reverse;
        gap: 10px;
        align-items: stretch;
    }
    .footer-actions-right {
        flex-direction: column-reverse;
        gap: 8px;
    }
    .btn-open-manksi,
    .btn-open-mmt,
    .btn-cancel,
    .btn-copy-link {
        justify-content: center;
        width: 100%;
    }
}
</style>
