class CreateDesks < ActiveRecord::Migration[7.1]
  def change
    create_table :desks do |t|
      t.string :label, null: false          # e.g. "A-12"
      t.string :zone,  null: false          # e.g. "North Wing"
      t.string :features                     # optional free text: "standing, dual-monitor"

      t.timestamps
    end

    add_index :desks, "lower(label)", unique: true, name: "index_desks_on_lower_label"
    add_index :desks, :zone
  end
end
