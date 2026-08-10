<template>
  <section class="panel">
    <div v-if="!hideHeader" class="panel-header">
      <div class="panel-title-wrap">
        <h2 class="panel-title">{{ title }}</h2>
        <el-tag v-if="tag" size="small" effect="light">{{ tag }}</el-tag>
      </div>
      <div v-if="$slots.actions" class="panel-actions">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  tag?: string
  hideHeader?: boolean
}>()
</script>

<style scoped lang="scss">
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 1.1rem;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
