<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import MigrationModal from "@/components/MigrationModal.vue";

const route = useRoute();
const router = useRouter();

const featureName = computed(
  () => (route.meta.featureName as string) || "Memo Approval Produk (MAP)",
);
const sourceMenu = computed(
  () =>
    (route.meta.sourceMenu as string) ||
    "Produksi MMT > Memo Approval Produk (MAP)",
);
const targetLocation = computed(
  () =>
    (route.meta.targetLocation as string) ||
    "Transaksi > Penjualan > Marketing > MAP (Memo Approval Produk)",
);
const targetPath = computed(
  () => (route.meta.targetPath as string) || "/penjualan/map",
);

const handleClose = () => {
  if (window.history.length > 2) {
    router.back();
  } else {
    router.push("/");
  }
};
</script>

<template>
  <div class="direct-migrated-placeholder">
    <MigrationModal
      :model-value="true"
      :feature-name="featureName"
      :source-menu="sourceMenu"
      :target-location="targetLocation"
      :target-path="targetPath"
      @update:model-value="handleClose"
    />
  </div>
</template>

<style scoped>
.direct-migrated-placeholder {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}
</style>
