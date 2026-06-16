import { getGeneratedDatabaseClient } from '#modula/server/data/runtime/factory'
import type {
  ArticleCreateInput,
  ArticleInclude,
  ArticleOrderByInput,
  ArticleRecord,
  ArticleSelect,
  ArticleUpdateInput,
  ArticleWhereInput,
  SiteParamsCreateInput,
  SiteParamsOrderByInput,
  SiteParamsRecord,
  SiteParamsSelect,
  SiteParamsUpdateInput,
  SiteParamsWhereInput,
  UserRecord
} from './models.generated'

type ArticleResult = ArticleRecord & {
  author?: Pick<UserRecord, 'id' | 'firstName' | 'lastName' | 'email'> | null
}

const client = () => getGeneratedDatabaseClient()

export const db = {
  article: {
    findMany(args: {
      where?: ArticleWhereInput
      orderBy?: ArticleOrderByInput
      select?: ArticleSelect
      include?: ArticleInclude
      take?: number
      skip?: number
    } = {}) {
      return client().model<ArticleResult, 'author'>('Article').findMany(args)
    },
    findFirst(args: {
      where?: ArticleWhereInput
      orderBy?: ArticleOrderByInput
      select?: ArticleSelect
      include?: ArticleInclude
      take?: number
      skip?: number
    } = {}) {
      return client().model<ArticleResult, 'author'>('Article').findFirst(args)
    },
    findUnique(args: {
      where: ArticleWhereInput
      select?: ArticleSelect
      include?: ArticleInclude
    }) {
      return client().model<ArticleResult, 'author'>('Article').findUnique(args)
    },
    count(args: { where?: ArticleWhereInput } = {}) {
      return client().model<ArticleResult, 'author'>('Article').count(args)
    },
    create(args: { data: ArticleCreateInput }) {
      return client().model<ArticleResult, 'author'>('Article').create(args)
    },
    update(args: { where: ArticleWhereInput; data: ArticleUpdateInput }) {
      return client().model<ArticleResult, 'author'>('Article').update(args)
    },
    delete(args: { where: ArticleWhereInput }) {
      return client().model<ArticleResult, 'author'>('Article').delete(args)
    },
    upsert(args: { where: ArticleWhereInput; create: ArticleCreateInput; update: ArticleUpdateInput }) {
      return client().model<ArticleResult, 'author'>('Article').upsert(args)
    }
  },
  siteParams: {
    findMany(args: {
      where?: SiteParamsWhereInput
      orderBy?: SiteParamsOrderByInput
      select?: SiteParamsSelect
      take?: number
      skip?: number
    } = {}) {
      return client().model<SiteParamsRecord>('SiteParams').findMany(args)
    },
    findFirst(args: {
      where?: SiteParamsWhereInput
      orderBy?: SiteParamsOrderByInput
      select?: SiteParamsSelect
      take?: number
      skip?: number
    } = {}) {
      return client().model<SiteParamsRecord>('SiteParams').findFirst(args)
    },
    findUnique(args: {
      where: SiteParamsWhereInput
      select?: SiteParamsSelect
    }) {
      return client().model<SiteParamsRecord>('SiteParams').findUnique(args)
    },
    count(args: { where?: SiteParamsWhereInput } = {}) {
      return client().model<SiteParamsRecord>('SiteParams').count(args)
    },
    create(args: { data: SiteParamsCreateInput }) {
      return client().model<SiteParamsRecord>('SiteParams').create(args)
    },
    update(args: { where: SiteParamsWhereInput; data: SiteParamsUpdateInput }) {
      return client().model<SiteParamsRecord>('SiteParams').update(args)
    },
    delete(args: { where: SiteParamsWhereInput }) {
      return client().model<SiteParamsRecord>('SiteParams').delete(args)
    },
    upsert(args: { where: SiteParamsWhereInput; create: SiteParamsCreateInput; update: SiteParamsUpdateInput }) {
      return client().model<SiteParamsRecord>('SiteParams').upsert(args)
    }
  }
}
