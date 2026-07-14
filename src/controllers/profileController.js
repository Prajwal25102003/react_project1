import { useCallback, useState } from 'react'
import { getProfileData } from '../models/profileModel.js'

export function useProfile() {
  const profile = getProfileData()
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  return {
    profile,
    isInfoModalOpen,
    isAddressModalOpen,
    openInfoModal: useCallback(() => setIsInfoModalOpen(true), []),
    closeInfoModal: useCallback(() => setIsInfoModalOpen(false), []),
    openAddressModal: useCallback(() => setIsAddressModalOpen(true), []),
    closeAddressModal: useCallback(() => setIsAddressModalOpen(false), []),
  }
}
