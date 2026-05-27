"use client";

// Completely disabled database/Supabase connections for the platform.
// This mock stub prevents any network, socket, or DNS resolution attempts,
// ensuring the entire platform loads instantly and functions offline-first.

class MockSupabaseQueryBuilder {
  private table: string;
  constructor(table: string) {
    this.table = table;
  }
  
  select() { return this; }
  insert() { return this; }
  update() { return this; }
  eq() { return this; }
  order() { return this; }
  limit() { return this; }
  single() { return this; }
  
  // Custom Promise compatibility so 'await supabase.from(...)' resolves immediately
  then(onfulfilled: any) {
    const result = { data: null, error: { message: "Database offline fallback activated" } };
    return Promise.resolve(onfulfilled(result));
  }
}

class MockSupabaseChannel {
  on() { return this; }
  subscribe() { return this; }
}

export const supabase = {
  from(table: string) {
    return new MockSupabaseQueryBuilder(table);
  },
  channel(name: string) {
    return new MockSupabaseChannel();
  },
  removeChannel(channel: any) {
    // No-op
  }
} as any;
