import supabase from './supabase'

function logFailure(label, err) {
  if (import.meta.env.DEV) console.warn(`[syncService] ${label} failed:`, err)
}

export async function createPlayerIfNotExists(userId) {
  try {
    await supabase
      .from('players')
      .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
  } catch (err) {
    logFailure('createPlayerIfNotExists', err)
  }
}

export async function syncAtlasToCloud(userId, collectedCountries) {
  try {
    if (!collectedCountries.length) return
    const rows = collectedCountries.map(countryId => ({
      player_id: userId,
      country_id: String(countryId),
    }))
    await supabase
      .from('atlas')
      .upsert(rows, { onConflict: 'player_id,country_id' })
  } catch (err) {
    logFailure('syncAtlasToCloud', err)
  }
}

export async function loadAtlasFromCloud(userId) {
  try {
    const { data, error } = await supabase
      .from('atlas')
      .select('country_id')
      .eq('player_id', userId)
    if (error) {
      logFailure('loadAtlasFromCloud', error)
      return []
    }
    return data ? data.map(row => row.country_id) : []
  } catch (err) {
    logFailure('loadAtlasFromCloud', err)
    return []
  }
}

export async function syncStreakToCloud(userId, currentStreak, bestStreak, lastPlayedDate) {
  try {
    await supabase
      .from('streaks')
      .upsert(
        { player_id: userId, current_streak: currentStreak, best_streak: bestStreak, last_played_date: lastPlayedDate },
        { onConflict: 'player_id' }
      )
  } catch (err) {
    logFailure('syncStreakToCloud', err)
  }
}

export async function loadStreakFromCloud(userId) {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('current_streak, best_streak, last_played_date')
      .eq('player_id', userId)
      .single()
    if (error) {
      logFailure('loadStreakFromCloud', error)
      return null
    }
    if (!data) return null
    return {
      currentStreak: data.current_streak ?? 0,
      bestStreak: data.best_streak ?? 0,
      lastPlayedDate: data.last_played_date ?? null,
    }
  } catch (err) {
    logFailure('loadStreakFromCloud', err)
    return null
  }
}
