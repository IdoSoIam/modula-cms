export interface FacebookPost {
  id: string
  message?: string
  created_time: string
  full_picture?: string
  permalink_url: string
  likes?: {
    summary: {
      total_count: number
    }
  }
  comments?: {
    summary: {
      total_count: number
    }
  }
}

export interface FacebookResponse {
  data: FacebookPost[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}

export interface FacebookError {
  message: string
  type: string
  code: number
  error_subcode?: number
  fbtrace_id: string
}

export interface FacebookAuthResponse {
  accessToken: string
  userID: string
  expiresIn: number
  signedRequest: string
  graphDomain: string
  data_access_expiration_time: number
}

export interface FacebookLoginStatus {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse: FacebookAuthResponse | null
}

export interface FacebookPage {
  access_token: string
  category: string
  name: string
  id: string
  tasks: string[]
}

export interface FacebookPagesResponse {
  data: FacebookPage[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}
