import { useSyncExternalStore } from "react"

export type StoredUser = {
  username: string
  password: string
  fullName: string
  dob: string
}

const USERS_KEY = "pm_users"
const SESSION_KEY = "pm_session"
const SESSION_EVENT = "pm_session_change"

export function calculateAge(dob: string): number {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }
  return age
}

export function isAdult(dob: string): boolean {
  return calculateAge(dob) >= 18
}

export function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function registerUser({
  username,
  password,
  fullName,
  dob,
}: StoredUser): StoredUser {
  if (!isAdult(dob)) {
    throw new Error("You must be at least 18 years old to register.")
  }

  const users = getUsers()
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("That username is already taken.")
  }

  const user: StoredUser = { username, password, fullName, dob }
  saveUsers([...users, user])
  return user
}

export function loginUser(username: string, password: string): StoredUser | null {
  const users = getUsers()
  return (
    users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
    ) ?? null
  )
}

let cachedSessionRaw: string | null = null
let cachedSession: StoredUser | null = null

export function getSession(): StoredUser | null {
  if (typeof window === "undefined") return null
  const username = localStorage.getItem(SESSION_KEY)
  if (!username) {
    cachedSessionRaw = null
    cachedSession = null
    return null
  }

  const user = getUsers().find((u) => u.username === username) ?? null
  const raw = JSON.stringify(user)
  if (raw !== cachedSessionRaw) {
    cachedSessionRaw = raw
    cachedSession = user
  }
  return cachedSession
}

export function setSession(username: string) {
  localStorage.setItem(SESSION_KEY, username)
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(SESSION_EVENT))
}

function subscribeToSession(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(SESSION_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(SESSION_EVENT, callback)
  }
}

function getServerSession() {
  return null
}

export function useSession(): StoredUser | null {
  return useSyncExternalStore(subscribeToSession, getSession, getServerSession)
}
