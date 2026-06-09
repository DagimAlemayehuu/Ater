interface ActivationMachineBindingOptions {
  profileMachineId: string | null | undefined
  fetchMachineId: () => Promise<string>
  bindMachineId: (machineId: string) => Promise<void>
}

export async function validateActivationMachineBinding({
  profileMachineId,
  fetchMachineId,
  bindMachineId
}: ActivationMachineBindingOptions): Promise<string> {
  let machineId: string
  try {
    machineId = await fetchMachineId()
  } catch {
    throw new Error('Unable to verify this device. Please restart Ater and try activation again.')
  }

  if (!machineId || machineId.trim() === '') {
    throw new Error('Unable to verify this device. Please restart Ater and try activation again.')
  }

  if (profileMachineId && profileMachineId !== machineId) {
    throw new Error('This activation key is already linked to another device. It cannot be used on multiple devices.')
  }

  if (!profileMachineId) {
    await bindMachineId(machineId)
  }

  return machineId
}
