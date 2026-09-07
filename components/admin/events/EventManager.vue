<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.eventsEditor.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.eventsEditor.intro') }}</p>
      </div>
      <button type="button" class="btn btn-primary" v-if="canCreate" @click="openCreateDialog">{{ t('admin.eventsEditor.create') }}</button>
    </div>

    <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section class="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
        <label class="form-control flex flex-col gap-2">
          <span class="label-text">{{ t('admin.eventsEditor.filter') }}</span>
          <select v-model="statusFilter" class="select select-bordered w-full" >
            <option value="">{{ t('admin.eventsEditor.all') }}</option>
            <option value="DRAFT">{{ t('admin.eventsEditor.DRAFT') }}</option>
            <option value="PUBLISHED">{{ t('admin.eventsEditor.PUBLISHED') }}</option>
            <option value="ARCHIVED">{{ t('admin.eventsEditor.ARCHIVED') }}</option>
            <option value="CANCELLED">{{ t('admin.eventsEditor.CANCELLED') }}</option>
          </select>
        </label>

        <div v-if="pending" class="py-6 text-center">
          <span class="loading loading-spinner loading-md" />
        </div>

        <div v-else-if="listError" role="alert" class="alert alert-error">
          {{ t('admin.eventsEditor.loadError') }}
          <button type="button" class="btn btn-sm" @click="refresh()">{{ t('admin.eventsEditor.retry') }}</button>
        </div>
        <p v-else-if="!events.length" class="py-6 text-center opacity-70">{{ t('admin.eventsEditor.empty') }}</p>
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{{ t('admin.eventsEditor.fieldTitle') }}</th>
                <th>{{ t('admin.eventsEditor.date') }}</th>
                <th>{{ t('admin.eventsEditor.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in events"
                :key="item.id"
                class="cursor-pointer"
                :class="selectedId === item.id ? 'bg-primary/10' : ''"
                @click="openEvent(item.id)"
              >
                <td class="font-medium">{{ item.title }}</td>
                <td>{{ formatDate(item.startsAt) }}</td>
                <td><EventsEventStatusBadge :status="item.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="editor" class="space-y-5 rounded-box border border-base-300 bg-base-100 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold">{{ editor.id ? t('admin.eventsEditor.edit') : t('admin.eventsEditor.create') }}</h2>
          </div>
          <div class="flex gap-2">
            <button v-if="editor.id && canDelete" type="button" class="btn btn-outline btn-error" @click="removeEvent">{{ t('admin.eventsEditor.delete') }}</button>
            <button type="button" class="btn btn-primary" :disabled="saving || !canUpdate" @click="saveEvent">
              <span v-if="saving" class="loading loading-spinner loading-sm" />
              {{ t('admin.eventsEditor.save') }}
            </button>
          </div>
        </div>

        <div class="space-y-3">
              <AdminPageBuilderTranslationTabs :model-value="titleTranslations" :label="t('admin.eventsEditor.visibleTitle')" @update:model-value="titleTranslations = $event" />
              <AdminPageBuilderTranslationTabs :model-value="subtitleTranslations" :label="t('admin.eventsEditor.subtitle')" multiline @update:model-value="subtitleTranslations = $event" />
              <AdminPageBuilderTranslationTabs :model-value="excerptTranslations" :label="t('admin.eventsEditor.excerpt')" multiline @update:model-value="excerptTranslations = $event" />
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.type') }}</span>
            <select v-model="editor.kind" class="select select-bordered w-full">
              <option value="EVENT">{{ t('admin.eventsEditor.event') }}</option>
              <option value="PERMANENCE">{{ t('admin.eventsEditor.shift') }}</option>
            </select>
          </label>
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.slug') }}</span>
            <input v-model="editor.slug" class="input input-bordered w-full" />
          </label>
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.status') }}</span>
            <select v-model="editor.status" class="select select-bordered w-full">
              <option value="DRAFT">{{ t('admin.eventsEditor.DRAFT') }}</option>
              <option value="PUBLISHED">{{ t('admin.eventsEditor.PUBLISHED') }}</option>
              <option value="ARCHIVED">{{ t('admin.eventsEditor.ARCHIVED') }}</option>
              <option value="CANCELLED">{{ t('admin.eventsEditor.CANCELLED') }}</option>
            </select>
          </label>
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.visibility') }}</span>
            <select v-model="editor.visibility" class="select select-bordered w-full">
              <option value="PUBLIC">{{ t('admin.eventsEditor.public') }}</option>
              <option v-if="associationRolesEnabled" value="PRIVATE">{{ t('admin.eventsEditor.private') }}</option>
            </select>
          </label>
        </div>

<AdminEventsEventDateFields v-model:starts-at="editor.startsAt" v-model:ends-at="editor.endsAt" />

        <section v-if="editor.kind === 'PERMANENCE'" class="space-y-4 rounded-2xl border border-base-300 bg-base-200 p-4">
          <div class="grid gap-4 lg:grid-cols-3">
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.recurrence') }}</span>
              <select v-model="editor.recurrenceType" class="select select-bordered w-full">
                <option value="WEEKLY">{{ t('admin.eventsEditor.weekly') }}</option>
                <option value="NONE">{{ t('admin.eventsEditor.none') }}</option>
              </select>
            </label>
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.seriesStart') }}</span>
              <input v-model="editor.recurrenceStartDate" type="date" class="input input-bordered w-full" />
            </label>
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.seriesEnd') }}</span>
              <input v-model="editor.recurrenceEndDate" type="date" class="input input-bordered w-full" />
            </label>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.startTime') }}</span>
              <input v-model="editor.recurrenceStartTime" type="time" class="input input-bordered w-full" />
            </label>
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.endTime') }}</span>
              <input v-model="editor.recurrenceEndTime" type="time" class="input input-bordered w-full" />
            </label>
          </div>

          <div class="space-y-2">
            <div class="text-sm font-medium">{{ t('admin.eventsEditor.weekdays') }}</div>
            <div class="grid gap-2 md:grid-cols-4">
              <label v-for="weekday in weekdays" :key="weekday.value" class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
                <input :checked="editor.recurrenceDays.includes(weekday.value)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleEditorRecurrenceDay(weekday.value, ($event.target as HTMLInputElement).checked)" />
                <span class="label-text">{{ weekday.label }}</span>
              </label>
            </div>
          </div>
        </section>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.place') }}</span>
            <input v-model="editor.placeName" class="input input-bordered w-full" />
          </label>
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.city') }}</span>
            <input v-model="editor.placeCity" class="input input-bordered w-full" />
          </label>
          <label class="form-control flex flex-col gap-2 lg:col-span-2">
            <span class="label-text">{{ t('admin.eventsEditor.address') }}</span>
            <input v-model="editor.placeAddress" class="input input-bordered w-full" />
          </label>
          <label class="form-control flex flex-col gap-2 lg:col-span-2">
            <span class="label-text">{{ t('admin.eventsEditor.map') }}</span>
            <input v-model="editor.mapUrl" class="input input-bordered w-full" />
          </label>
          <div class="form-control flex flex-col gap-2 lg:col-span-2">
            <span class="label-text">{{ t('admin.eventsEditor.cover') }}</span>
            <ImageInput v-model="editor.coverImageUrl" />
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
            <input v-model="editor.publicReservationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="label-text">{{ t('admin.eventsEditor.reservation') }}</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
            <input v-model="editor.internalParticipationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="label-text">{{ t('admin.eventsEditor.participation') }}</span>
          </label>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <label v-if="editor.publicReservationEnabled" class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.capacity') }}</span>
            <input v-model.number="editor.publicCapacity" type="number" min="0" class="input input-bordered w-full" />
          </label>
          <label v-if="editor.internalParticipationEnabled" class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.internalCapacity') }}</span>
            <input v-model.number="editor.internalCapacity" type="number" min="0" class="input input-bordered w-full" />
          </label>
          <label v-if="editor.internalParticipationEnabled" class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.approval') }}</span>
            <select v-model="editor.internalParticipationApprovalMode" class="select select-bordered w-full">
              <option value="AUTO">{{ t('admin.eventsEditor.auto') }}</option>
              <option value="MANUAL">{{ t('admin.eventsEditor.manual') }}</option>
            </select>
          </label>
        </div>

        <AdminPageBuilderTranslationTabs v-if="editor.internalParticipationEnabled" v-model="editor.internalParticipationInfo" :label="t('admin.eventsEditor.info')" multiline />

          <label v-if="associationRolesEnabled && (editor.internalParticipationEnabled || editor.visibility === 'PRIVATE')" class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.roles') }}</span>
            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="grid gap-2">
                <label v-for="role in roles" :key="role.id" class="label cursor-pointer justify-start gap-3">
                  <input :checked="editor.audienceMemberRoleIds.includes(role.id)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleAudienceRole(role.id, ($event.target as HTMLInputElement).checked)" />
                  <span class="label-text">{{ role.name }}</span>
                </label>
              </div>
            </div>
          </label>

        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-xl font-semibold">{{ t('admin.eventsEditor.content') }}</h3>
            </div>
          </div>
          <div class="tabs tabs-box flex-wrap">
            <button
              v-for="localeCode in resolvedLocales"
              :key="localeCode"
              type="button"
              class="tab"
              :class="{ 'tab-active': contentLocale === localeCode }"
              @click="contentLocale = localeCode"
            >
              {{ localeCode.toUpperCase() }}
            </button>
          </div>
          <CmsPageContentBuilder :content="editor.translations[contentLocale]?.content ?? editor.translations.fr.content" />
        </section>

        <section v-if="editor.id && canSendCall" class="space-y-4 rounded-2xl border border-base-300 bg-base-200 p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold">{{ t('admin.eventsEditor.call') }}</h3>
              <p class="text-sm opacity-70">{{ t('admin.eventsEditor.callHelp') }}</p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" :disabled="sendingCall" @click="sendCall">
              <span v-if="sendingCall" class="loading loading-spinner loading-sm" />
              {{ t('admin.eventsEditor.send') }}
            </button>
          </div>
          <div class="grid gap-4 xl:grid-cols-2">
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.subject') }}</span>
              <input v-model="callForm.subject" class="input input-bordered w-full" />
            </label>
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.emails') }}</span>
              <input v-model="callForm.manualEmails" class="input input-bordered w-full" />
            </label>
          </div>
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.body') }}</span>
            <textarea v-model="callForm.body" class="textarea textarea-bordered min-h-32 w-full" />
          </label>
          <label class="form-control flex flex-col gap-2">
            <span class="label-text">{{ t('admin.eventsEditor.extra') }}</span>
            <textarea v-model="callForm.extraMessage" class="textarea textarea-bordered min-h-24 w-full" />
          </label>
          <div class="grid gap-2 md:grid-cols-2">
            <label v-for="candidate in eligibleUsers" :key="candidate.id" class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
              <input :checked="callForm.selectedUserIds.includes(candidate.id)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleCallUser(candidate.id, ($event.target as HTMLInputElement).checked)" />
              <span class="label-text">{{ candidate.firstName || candidate.email }} {{ candidate.lastName || '' }}<span class="ml-2 opacity-60">{{ candidate.email }}</span></span>
            </label>
          </div>
        </section>
      </section>
    </div>

    <dialog ref="createDialogRef" class="modal">
      <div class="modal-box max-w-3xl">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold">{{ t('admin.eventsEditor.createTitle') }}</h2>
            <p class="text-sm opacity-70">{{ t('admin.eventsEditor.createHelp') }}</p>
          </div>
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">✕</button>
          </form>
        </div>

        <div class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-2">
            <AdminPageBuilderTranslationTabs :model-value="createForm.title" :label="t('admin.eventsEditor.visibleTitle')" @update:model-value="createForm.title = $event" />
            <AdminPageBuilderTranslationTabs :model-value="createForm.subtitle" :label="t('admin.eventsEditor.subtitle')" multiline @update:model-value="createForm.subtitle = $event" />
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.slug') }}</span>
              <input v-model="createForm.slug" class="input input-bordered w-full" />
            </label>
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.visibility') }}</span>
            <select v-model="createForm.visibility" class="select select-bordered w-full">
              <option value="PUBLIC">{{ t('admin.eventsEditor.public') }}</option>
              <option v-if="associationRolesEnabled" value="PRIVATE">{{ t('admin.eventsEditor.private') }}</option>
            </select>
          </label>
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.initial') }}</span>
              <select v-model="createForm.status" class="select select-bordered w-full">
                <option value="DRAFT">{{ t('admin.eventsEditor.DRAFT') }}</option>
                <option value="PUBLISHED">{{ t('admin.eventsEditor.PUBLISHED') }}</option>
              </select>
            </label>
          </div>

<AdminEventsEventDateFields v-model:starts-at="createForm.startsAt" v-model:ends-at="createForm.endsAt" />

          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.place') }}</span>
              <input v-model="createForm.placeName" class="input input-bordered w-full" />
            </label>
            <label class="form-control flex flex-col gap-2">
              <span class="label-text">{{ t('admin.eventsEditor.city') }}</span>
              <input v-model="createForm.placeCity" class="input input-bordered w-full" />
            </label>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
              <input v-model="createForm.publicReservationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              <span class="label-text">{{ t('admin.eventsEditor.reservation') }}</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
              <input v-model="createForm.internalParticipationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              <span class="label-text">{{ t('admin.eventsEditor.participation') }}</span>
            </label>
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn">{{ t('admin.eventsEditor.cancel') }}</button>
          </form>
          <button type="button" class="btn btn-primary" :disabled="creating" @click="createEventAndOpenLiveEdit">
            <span v-if="creating" class="loading loading-spinner loading-sm" />
            {{ t('admin.eventsEditor.createEdit') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>{{ t('admin.eventsEditor.close') }}</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import CmsPageContentBuilder from '#modula/components/admin/cms/CmsPageContentBuilder.vue'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import { useEventAdmin } from '#modula/composables/useEventAdmin'
const { weekdays, auth, canCreate, canUpdate, canDelete, canSendCall, route, localePath, siteConfig, statusFilter, selectedId, saving, sendingCall, creating, resolvedLocales, contentLocale, createDialogRef, events, roles, allUsers, associationRolesEnabled, editor, eligibleUsers, createForm, callForm, formatDate, openCreateDialog, titleTranslations, subtitleTranslations, excerptTranslations, resetCallForm, openEvent, saveEvent, createEventAndOpenLiveEdit, removeEvent, toggleAudienceRole, toggleEditorRecurrenceDay, loadEligibleUsers, toggleCallUser, sendCall, pending, listError, refresh, t } = useEventAdmin()
</script>
