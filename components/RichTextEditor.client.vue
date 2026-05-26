<template>
  <div class="rich-text-editor border border-base-300 rounded-box bg-base-100">
    <div v-if="editor" class="flex flex-wrap gap-1 p-2 border-b border-base-300 bg-base-200 rounded-t-box">
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
        <Icon name="mdi:format-bold" size="16" />
      </button>
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()">
        <Icon name="mdi:format-italic" size="16" />
      </button>
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()">
        <Icon name="mdi:format-strikethrough" size="16" />
      </button>
      <div class="divider divider-horizontal mx-0" />
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
        H2
      </button>
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">
        H3
      </button>
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('paragraph') }" @click="editor.chain().focus().setParagraph().run()">
        P
      </button>
      <div class="divider divider-horizontal mx-0" />
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">
        <Icon name="mdi:format-list-bulleted" size="16" />
      </button>
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">
        <Icon name="mdi:format-list-numbered" size="16" />
      </button>
      <button type="button" class="btn btn-xs btn-ghost" :class="{ 'btn-active': editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">
        <Icon name="mdi:format-quote-close" size="16" />
      </button>
      <div class="divider divider-horizontal mx-0" />
      <button type="button" class="btn btn-xs btn-ghost" @click="setLink">
        <Icon name="mdi:link" size="16" />
      </button>
      <button type="button" class="btn btn-xs btn-ghost" @click="pickerOpen = true">
        <Icon name="mdi:image-plus" size="16" />
      </button>
      <div class="divider divider-horizontal mx-0" />
      <button type="button" class="btn btn-xs btn-ghost" @click="editor.chain().focus().undo().run()">
        <Icon name="mdi:undo" size="16" />
      </button>
      <button type="button" class="btn btn-xs btn-ghost" @click="editor.chain().focus().redo().run()">
        <Icon name="mdi:redo" size="16" />
      </button>
    </div>
    <EditorContent :editor="editor" class="prose max-w-none p-4 min-h-48 focus:outline-none" />

    <ImagePicker v-model:open="pickerOpen" @select="onImageSelect" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const pickerOpen = ref(false)

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Image,
    Link.configure({ openOnClick: false, autolink: true })
  ],
  editorProps: {
    attributes: {
      class: 'prose max-w-none p-4 min-h-48 focus:outline-none'
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  if (val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val || '', { emitUpdate: false })
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('URL du lien', previousUrl ?? 'https://')
  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const onImageSelect = (url: string) => {
  editor.value?.chain().focus().setImage({ src: url }).run()
  pickerOpen.value = false
}
</script>

<style>
.rich-text-editor .ProseMirror {
  min-height: 12rem;
  outline: none;
}
.rich-text-editor .ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}
</style>
