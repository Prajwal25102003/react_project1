import { useState } from 'react'
import { getNavModules } from '../models/navModel.js'

export function useNavModules() {
  const [activeModuleId, setActiveModuleId] = useState('dashboard')

  return {
    modules: getNavModules(),
    activeModuleId,
    selectModule: setActiveModuleId,
  }
}
