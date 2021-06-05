export module InviteCode {
  export interface Schema {
    creator: {
      uid: string;
      display_name?: string;
    };
    uses_left: number;
  }
}
