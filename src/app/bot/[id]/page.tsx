import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { BotChat } from '@/components/BotChat'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Props {
  params: { id: string }
}

export default async function BotPublicPage({ params }: Props) {
  const { data: bot, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', params.id)
    .eq('activo', true)
    .single()

  if (error || !bot) notFound()

  return <BotChat bot={bot} />
}
