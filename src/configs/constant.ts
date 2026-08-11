import type { Component } from 'vue'

export interface SelectOption<T = string> {
  value: T
  label: string
  icon?: Component
}
