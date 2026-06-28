# Idempotent seed data: safe to run repeatedly. Creates one demo employee and
# a floor plan of desks across four office zones.
puts "Seeding DeskFlex..."

demo = User.find_or_initialize_by(email: "demo@deskflex.app")
demo.assign_attributes(name: "Demo Employee", password: "password123", password_confirmation: "password123")
demo.save!
puts "  user: #{demo.email} / password123"

ZONES = {
  "North Wing"  => { count: 8,  features: ["standing desk", "dual monitor", nil, "window seat"] },
  "South Wing"  => { count: 8,  features: ["dual monitor", nil, "near kitchen", nil] },
  "Quiet Zone"  => { count: 6,  features: ["noise-cancelling", nil, "single monitor"] },
  "Collab Hub"  => { count: 6,  features: ["whiteboard", "large screen", nil] }
}.freeze

ZONES.each do |zone, config|
  prefix = zone.split.map { |w| w[0] }.join.upcase # "North Wing" -> "NW"
  config[:count].times do |i|
    label = format("%s-%02d", prefix, i + 1)
    desk = Desk.find_or_initialize_by(label: label)
    desk.assign_attributes(zone: zone, features: config[:features].sample)
    desk.save!
  end
  puts "  zone: #{zone} (#{config[:count]} desks)"
end

puts "Done. #{Desk.count} desks across #{ZONES.size} zones."
