import projectConfig from './cms.project.config'
import { createModulaCmsHostConfig } from 'modula-cms/host'

export default createModulaCmsHostConfig(projectConfig, {
  devtools: {
    enabled: true
  }
})
