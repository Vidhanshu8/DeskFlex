class User < ApplicationRecord
  has_secure_password

  has_many :bookings, dependent: :destroy

  EMAIL_FORMAT = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/

  before_validation { self.email = email.to_s.downcase.strip }

  validates :name, presence: true, length: { maximum: 120 }
  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: EMAIL_FORMAT, message: "is not a valid email address" }
  # `has_secure_password` already validates presence + confirmation of password
  # on create; we add a minimum length on top of that.
  validates :password, length: { minimum: 8 }, allow_nil: true
end
