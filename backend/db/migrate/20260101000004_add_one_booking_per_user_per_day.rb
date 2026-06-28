class AddOneBookingPerUserPerDay < ActiveRecord::Migration[7.1]
  def change
    # The hard guarantee that a user holds at most one desk on a given date.
    # Pairs with the model validation for a friendly message; this index closes
    # the race-condition window between two concurrent requests.
    add_index :bookings, %i[user_id booking_date], unique: true,
              name: "index_bookings_on_user_and_date"
  end
end
