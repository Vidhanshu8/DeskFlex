class CreateBookings < ActiveRecord::Migration[7.1]
  def change
    create_table :bookings do |t|
      t.references :user, null: false, foreign_key: true
      t.references :desk, null: false, foreign_key: true
      t.date :booking_date, null: false

      t.timestamps
    end

    # The hard guarantee that no desk is double-booked on the same date.
    add_index :bookings, %i[desk_id booking_date], unique: true,
              name: "index_bookings_on_desk_and_date"
    add_index :bookings, :booking_date
  end
end
