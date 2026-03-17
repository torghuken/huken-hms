export function getSelectedVenue() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("selectedVenue") || ""
}

export function getSelectedEmployeeId() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("selectedEmployeeId") || ""
}

export function getSelectedEmployeeName() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("selectedEmployeeName") || ""
}

export function getSelectedEmployeeRole() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("selectedEmployeeRole") || ""
}

export function isLeader() {
  if (typeof window === "undefined") return false
  return localStorage.getItem("selectedEmployeeRole") === "leader"
}

export function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem("selectedVenue")
  localStorage.removeItem("selectedEmployeeId")
  localStorage.removeItem("selectedEmployeeName")
  localStorage.removeItem("selectedEmployeeRole")
}