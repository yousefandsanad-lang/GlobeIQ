import supabase from './supabase'

export async function createPlayerIfNotExists(userId) {
  try {
    await supabase
      .from('players')
      .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
  } catch {
    // ignore
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
  } catch {
    // ignore — local state is source of truth
  }
}

export async function loadAtlasFromCloud(userId) {
  try {
    const { data, error } = await supabase
      .from('atlas')
      .select('country_id')
      .eq('player_id', userId)
    if (error || !data) return []
    return data.map(row => row.country_id)
  } catch {
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
  } catch {
    // ignore
  }
}

export async function loadStreakFromCloud(userId) {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('current_streak, best_streak, last_played_date')
      .eq('player_id', userId)
      .single()
    if (error || !data) return null
    return {
      currentStreak: data.current_streak ?? 0,
      bestStreak: data.best_streak ?? 0,
      lastPlayedDate: data.last_played_date ?? null,
    }
  } catch {
    return null
  }
}
