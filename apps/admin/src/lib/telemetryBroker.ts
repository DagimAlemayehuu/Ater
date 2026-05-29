import { supabase } from './supabase'

export interface LedgerRow {
  amount: number;
  created_at: string;
  feature_slug: string | null;
}

export interface UsageLogRow {
  id?: string;
  model_name: string | null;
  academic_domain: string | null;
  feature_type: string | null;
  token_count: number | null;
  created_at: string;
}

export interface TelemetryMetrics {
  creditsBurned: number;
  activeNodes: number;
  waitlistCount: number;
  usageLogs7Days: UsageLogRow[];
  latestLogs15: UsageLogRow[];
}

export class TelemetryBroker {
  /**
   * Fetches all raw summary metrics from Supabase in parallel.
   */
  static async fetchSummaryMetrics(): Promise<TelemetryMetrics> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Run queries in parallel
    const [
      ledgerResult,
      nodesResult,
      waitlistResult,
      usageResult,
      latestLogsResult
    ] = await Promise.all([
      supabase
        .from('credit_ledger')
        .select('amount, created_at, feature_slug')
        .gte('created_at', today.toISOString()),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('account_status', 'active'),
      supabase
        .from('waiting_list')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('usage_logs')
        .select('id, model_name, created_at, academic_domain, token_count, feature_type')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('usage_logs')
        .select('model_name, academic_domain, created_at, feature_type, token_count')
        .order('created_at', { ascending: false })
        .limit(15)
    ])

    if (ledgerResult.error) throw ledgerResult.error;
    if (usageResult.error) throw usageResult.error;
    if (latestLogsResult.error) throw latestLogsResult.error;

    const ledgerData = (ledgerResult.data as LedgerRow[]) || []
    const burned = Math.abs(
      ledgerData
        .filter((l: LedgerRow) => l.amount < 0)
        .reduce((acc: number, l: LedgerRow) => acc + l.amount, 0)
    )

    return {
      creditsBurned: burned,
      activeNodes: nodesResult.count || 0,
      waitlistCount: waitlistResult.count || 0,
      usageLogs7Days: (usageResult.data as UsageLogRow[]) || [],
      latestLogs15: (latestLogsResult.data as UsageLogRow[]) || []
    }
  }
}
