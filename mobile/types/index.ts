export interface CurrentUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  bannerImage: string;
  bio: string;
  role: string;
  followers: string[];
  following: string[];
  friends: string[];
  cart: CartItem[];
  wishlist: WishlistItem[];
  addresses: Address[];
  friendRequests: string[];
}
export interface User {
  _id: string;
  firstname: string;
  email: string;
  profilePicture: string;
}
export interface CartItem {
  product: string;
  image: string;
  name: string;
  category: string;
  quantity: number;
  finalPrice: number;
}

export interface WishlistItem {
  product: string;
  name: string;
  image: string;
  finalPrice: number;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  commune?: string;
  city: string;
  notes?: string;
  defaultAddress: boolean;
}

export interface PublicUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  bannerImage: string;
  bio: string;
  followers: PublicUser[];
  following: PublicUser[];
  friends: PublicUser[];
}

export interface UseCurrentUserReturn {
  dbUser: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Profile
  updateMe: (
    data:
      | FormData
      | Partial<
          Pick<
            CurrentUser,
            | "firstName"
            | "lastName"
            | "username"
            | "bio"
            | "profilePicture"
            | "bannerImage"
          >
        >,
  ) => Promise<CurrentUser | null>;
  deleteMe: () => Promise<boolean>;

  // Cart
  getCart: () => Promise<CartItem[]>;
  addToCart: (
    item: Omit<CartItem, "quantity"> & { quantity?: number },
  ) => Promise<CartItem[]>;
  updateCartItem: (productId: string, quantity: number) => Promise<CartItem[]>;
  removeFromCart: (productId: string) => Promise<CartItem[]>;
  clearCart: () => Promise<CartItem[]>;

  // Wishlist
  getWishlist: () => Promise<WishlistItem[]>;
  toggleWishlist: (
    item: WishlistItem,
  ) => Promise<{ action: "added" | "removed"; data: WishlistItem[] }>;
  removeFromWishlist: (productId: string) => Promise<WishlistItem[]>;

  // Address
  getAddresses: () => Promise<Address[]>;
  addAddress: (
    address: Omit<Address, "defaultAddress"> & { defaultAddress?: boolean },
  ) => Promise<Address[]>;
  updateAddress: (index: number, data: Partial<Address>) => Promise<Address[]>;
  deleteAddress: (index: number) => Promise<Address[]>;
  setDefaultAddress: (index: number) => Promise<Address[]>;

  // Social - User
  getUserById: (id: string) => Promise<PublicUser | null>;
  getFollowers: (id: string) => Promise<PublicUser[]>;
  getFollowing: (id: string) => Promise<PublicUser[]>;
  getFriends: (id: string) => Promise<PublicUser[]>;

  // Social - Actions
  toggleFollow: (id: string) => Promise<"followed" | "unfollowed">;
  sendFriendRequest: (id: string) => Promise<boolean>;
  acceptFriendRequest: (id: string) => Promise<boolean>;
  removeFriend: (id: string) => Promise<boolean>;

  isFriend: (userId: string) => boolean;
  isFollowing: (userId: string) => boolean;
  isFriendRequestSent: (userId: string) => boolean;
}

export interface MessageSender {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: MessageSender | string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatLastMessage {
  _id: string;
  text: string;
  sender: string;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participant: MessageSender;
  lastMessage: ChatLastMessage | null;
  lastMessageAt: string;
  createdAt: string;
}
