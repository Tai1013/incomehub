import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
import 'element-plus/dist/index.css'
import 'dayjs/locale/zh-tw.js'
import router from './router'
import './styles/main.scss'

const app = createApp(App)

app.use(createPinia())
app.use(ElementPlus, { locale: zhTw })
app.use(router)
app.mount('#app')
