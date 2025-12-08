export const authValidations = {
  register: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      type: "string",
      pattern: /^[a-zA-Z\s]*$/,
    },
    email: {
      required: true,
      type: "email",
      unique: true,
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 50,
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      description:
        "Password must contain uppercase, lowercase, number, and special character",
    },
    confirmPassword: {
      required: true,
      match: "password",
    },
  },

  login: {
    email: {
      required: true,
      type: "email",
    },
    password: {
      required: true,
      minLength: 8,
    },
  },

  updateProfile: {
    name: {
      required: false,
      minLength: 2,
      maxLength: 100,
    },
    phone: {
      required: false,
      pattern: /^[0-9]{10}$/,
      description: "Phone must be 10 digits",
    },
    avatar: {
      required: false,
      type: "url",
    },
  },

  changePassword: {
    oldPassword: {
      required: true,
      minLength: 8,
    },
    newPassword: {
      required: true,
      minLength: 8,
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    confirmPassword: {
      required: true,
      match: "newPassword",
    },
  },

  requestPasswordReset: {
    email: {
      required: true,
      type: "email",
    },
  },

  resetPassword: {
    token: {
      required: true,
      type: "string",
    },
    newPassword: {
      required: true,
      minLength: 8,
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    confirmPassword: {
      required: true,
      match: "newPassword",
    },
  },
};

export const hotelValidations = {
  create: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 100,
      type: "string",
    },
    description: {
      required: true,
      minLength: 20,
      maxLength: 2000,
    },
    location: {
      address: { required: true, type: "string" },
      city: { required: true, type: "string" },
      state: { required: false, type: "string" },
      pincode: { required: false, type: "string" },
    },
    pricePerNight: {
      required: true,
      type: "number",
      min: 0,
    },
    amenities: {
      required: false,
      type: "array",
    },
    checkInTime: {
      required: false,
      pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    checkOutTime: {
      required: false,
      pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    phone: {
      required: true,
      pattern: /^[0-9]{10}$/,
    },
    email: {
      required: true,
      type: "email",
    },
  },

  update: {
    name: { required: false, minLength: 3, maxLength: 100 },
    description: { required: false, minLength: 20, maxLength: 2000 },
    pricePerNight: { required: false, type: "number", min: 0 },
    amenities: { required: false, type: "array" },
  },

  search: {
    city: { required: false, type: "string" },
    minPrice: { required: false, type: "number", min: 0 },
    maxPrice: { required: false, type: "number", min: 0 },
    rating: { required: false, type: "number", min: 0, max: 5 },
    amenities: { required: false, type: "array" },
    page: { required: false, type: "number", min: 1 },
    limit: { required: false, type: "number", min: 1, max: 100 },
  },
};

export const reviewValidations = {
  create: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 100,
    },
    content: {
      required: true,
      minLength: 20,
      maxLength: 1000,
    },
    rating: {
      required: true,
      type: "number",
      min: 1,
      max: 5,
    },
    hotel: {
      required: true,
      type: "objectId",
    },
    visitDate: {
      required: false,
      type: "date",
    },
  },

  update: {
    title: { required: false, minLength: 5, maxLength: 100 },
    content: { required: false, minLength: 20, maxLength: 1000 },
    rating: { required: false, type: "number", min: 1, max: 5 },
  },
};

export const blogValidations = {
  create: {
    title: {
      required: true,
      minLength: 10,
      maxLength: 200,
    },
    content: {
      required: true,
      minLength: 100,
    },
    excerpt: {
      required: false,
      maxLength: 500,
    },
    category: {
      required: true,
      enum: [
        "Travel Guide",
        "Local Culture",
        "Adventure",
        "Nature",
        "Food",
        "History",
        "Events",
        "Tips",
        "Other",
      ],
    },
    tags: {
      required: false,
      type: "array",
    },
  },

  update: {
    title: { required: false, minLength: 10, maxLength: 200 },
    content: { required: false, minLength: 100 },
    category: { required: false },
    tags: { required: false, type: "array" },
  },
};

export const placeValidations = {
  create: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 100,
    },
    description: {
      required: true,
      minLength: 50,
      maxLength: 2000,
    },
    city: {
      required: true,
      type: "string",
    },
    category: {
      required: true,
      enum: [
        "Temple",
        "Waterfall",
        "National Park",
        "Wildlife",
        "Museum",
        "Historical",
        "Adventure",
        "Beach",
        "Hill Station",
        "Other",
      ],
    },
    entryFee: {
      required: false,
      type: "number",
      min: 0,
    },
    highlights: {
      required: false,
      type: "array",
    },
  },

  update: {
    name: { required: false, minLength: 3, maxLength: 100 },
    description: { required: false, minLength: 50, maxLength: 2000 },
    category: { required: false },
    entryFee: { required: false, type: "number", min: 0 },
  },
};

export const feedbackValidations = {
  create: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      required: true,
      type: "email",
    },
    subject: {
      required: true,
      minLength: 5,
      maxLength: 100,
    },
    message: {
      required: true,
      minLength: 20,
      maxLength: 5000,
    },
    category: {
      required: true,
      enum: ["bug", "suggestion", "complaint", "partnership", "other"],
    },
    rating: {
      required: false,
      type: "number",
      min: 1,
      max: 5,
    },
  },
};
