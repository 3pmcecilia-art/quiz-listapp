import { supabase } from './supabase.js'

function rowToCard(row) {
  return {
    id:              row.id,
    type:            row.type,
    sentence:        row.sentence,
    problem:         row.problem,
    answer:          row.answer,
    memo:            row.memo,
    grammarAnalysis: row.grammar_analysis,
    createdAt:       row.created_at,
  }
}

export async function loadCards(type) {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(rowToCard)
}

export async function addCard(type, card) {
  const { error } = await supabase.from('quiz_results').insert({
    id:               card.id,
    type,
    sentence:         card.sentence        ?? null,
    problem:          card.problem         ?? null,
    answer:           card.answer          ?? null,
    memo:             card.memo            ?? null,
    grammar_analysis: card.grammarAnalysis ?? null,
    created_at:       card.createdAt,
  })
  if (error) throw error
}

export async function updateCard(id, fields) {
  const patch = {}
  if ('memo'            in fields) patch.memo             = fields.memo            ?? null
  if ('grammarAnalysis' in fields) patch.grammar_analysis = fields.grammarAnalysis ?? null
  if ('sentence'        in fields) patch.sentence         = fields.sentence        ?? null
  if ('problem'         in fields) patch.problem          = fields.problem         ?? null
  if ('answer'          in fields) patch.answer           = fields.answer          ?? null
  const { error } = await supabase.from('quiz_results').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCard(id) {
  const { error } = await supabase.from('quiz_results').delete().eq('id', id)
  if (error) throw error
}
