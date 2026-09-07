import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import { parse, compileScript } from '@vue/compiler-sfc'
import { chromium } from 'playwright-core'

const root = process.cwd()
const output = path.join(root, '.data/dropdown-qa')
await mkdir(output, { recursive: true })
const result = await build({
  stdin: { contents: `import { createApp, h, ref } from 'vue';
    import Roles from './components/admin/MemberRoleMultiSelect.vue';
    import Dropdown from './components/FloatingDropdown.vue';
    const app = createApp({ setup() { const value = ref([1]); return () => h(Roles, { modelValue: value.value, 'onUpdate:modelValue': next => { value.value = next; globalThis.selected = next }, options: [{id:1,name:'Administration'},{id:2,name:'Jardinier'}] }) } });
    app.component('FloatingDropdown', Dropdown); app.component('Icon', {render:()=>null}); app.mount('#app');`, resolveDir: root },
  write: false, bundle: true, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false' },
  plugins: [{ name: 'vue', setup(builder) {
    builder.onLoad({filter:/\.vue$/}, async args => {
      const {descriptor} = parse(await readFile(args.path,'utf8'), {filename:args.path})
      return { contents: `import { ref, computed, useId, onMounted, onBeforeUnmount, watch } from 'vue';\n${compileScript(descriptor,{id:args.path,inlineTemplate:true}).content}`, loader:'ts',resolveDir:path.dirname(args.path) }
    })
  }}]
})
const browser = await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
  for(const width of [390,1280]) {
    const page = await browser.newPage({viewport:{width,height:700}})
    const errors=[]; page.on('pageerror',error=>errors.push(error.message))
    await page.setContent('<style>dialog{width:280px;height:230px;padding:12px;overflow:auto} #app{margin-top:170px} [popover]{padding:12px} label{display:block} input[type=text]{width:90%}</style><dialog><div id="app"></div></dialog>')
    await page.addScriptTag({content:result.outputFiles[0].text})
    await page.evaluate(()=>document.querySelector('dialog').showModal())
    await page.locator('#app button').first().click()
    const panel=page.locator('[popover]')
    await panel.waitFor({state:'visible'})
    const box=await panel.boundingBox()
    assert.ok(box.x>=0 && box.x+box.width<=width && box.y>=0 && box.y+box.height<=700)
    assert.equal(await panel.evaluate(el=>{ const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+20,r.y+r.height-10)) }),true,'Panel must be above the modal and not clipped')
    await panel.getByText('Jardinier',{exact:true}).click()
    assert.deepEqual(await page.evaluate(()=>globalThis.selected),[1,2])
    await panel.locator('input[type=text]').fill('jardin')
    assert.equal(await panel.locator('input[type=checkbox]').count(),1)
    await page.screenshot({path:path.join(output,`roles-${width}.png`)})
    await page.keyboard.press('Escape')
    await panel.waitFor({state:'hidden'})
    assert.equal(await page.locator('dialog').evaluate(el=>el.open),true,'Escape closes menu before dialog')
    assert.deepEqual(errors,[])
    console.log(`PASS roles in clipped modal at ${width}px: top layer, selection, search, Escape`)
    await page.close()
  }
} finally {await browser.close()}
