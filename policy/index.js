const { AbilityBuilder, Ability } = require('@casl/ability');  
  
const policies = {  
    guest(user, { can }) {  
        // Tamu bisa membaca karya seni dan berita/acara  
        can('read', 'Artwork'); // Tamu bisa membaca karya seni  
        can('read', 'NewsEvent'); // Tamu bisa membaca berita dan acara  
    },  
    customer(user, { can }) {  
        can('update', 'User', { _id: user._id });  
        can('create', 'Conversation');  
        can('read', 'Conversation', { ID_Customer: user._id });  
        can('create', 'Message');  
        can('read', 'Message', { 'conversation.ID_Customer': user._id });  
  
        // Kebijakan untuk ArtworkCustom  
        can('create', 'ArtworkCustom');  
          
        // Kebijakan untuk ArtRequest_Artwork  
        can('create', 'ArtRequest_Artwork');  
        can('read', 'ArtRequest_Artwork', { ID_Customer: user._id });  
        can('update', 'ArtRequest_Artwork', { ID_Customer: user._id });  
        can('delete', 'ArtRequest_Artwork', { ID_Customer: user._id });  
  
        // Kebijakan untuk Address  
        can('create', 'Address');  
        can('read', 'Address', { ID_User: user._id });  
        can('update', 'Address', { ID_User: user._id });  
        can('delete', 'Address', { ID_User: user._id });  
  
        // Kebijakan untuk OriginAddress  
        can('read', 'OriginAddress', { ID_User: user._id });  
  
        // Kebijakan untuk Order  
        can('create', 'Order');  
        can('read', 'Order', { ID_User: user._id });  
        can('update', 'Order', { ID_User: user._id, OrderStatus: 'shipped' });  
        can('delete', 'Order', { ID_User: user._id, OrderStatus: 'pending' });  
  
        // Kebijakan untuk Shipment  
        can('create', 'Shipment');  
        can('read', 'Shipment', { 'order.ID_User': user._id });  
  
        // Kebijakan untuk Payment  
        can('create', 'Payment');  
        can('read', 'Payment', { ID_User: user._id });  
        can('update', 'Payment', { ID_User: user._id, PaymentStatus: 'pending' }); // Hanya bisa mengupdate status pembayaran jika masih pending  
  
        // Kebijakan untuk NewsEvent  
        can('read', 'NewsEvent');
    },  
    artist(user, { can }) {  
        can('update', 'User', { _id: user._id });  
        can('create', 'Artwork', { _id: user._id });  
        can('update', 'Artwork', { ID_User: user._id });  
        can('delete', 'Artwork', { ID_User: user._id });  
  
        // Kebijakan untuk ArtRequest_Artwork  
        can('create', 'ArtRequest_Artwork');  
        can('read', 'ArtRequest_Artwork', { ID_Customer: user._id });  
        can('update', 'ArtRequest_Artwork', { ID_Customer: user._id });  
        can('delete', 'ArtRequest_Artwork', { ID_Customer: user._id });  
  
        // Kebijakan untuk Address  
        can('create', 'Address');  
        can('read', 'Address', { ID_User: user._id });  
        can('update', 'Address', { ID_User: user._id });  
        can('delete', 'Address', { ID_User: user._id });  
  
        // Kebijakan untuk OriginAddress  
        can('read', 'OriginAddress', { ID_User: user._id });  
  
        // Kebijakan untuk Shipment  
        can('read', 'Shipment', { 'order.ID_User': user._id });  
  
        // Kebijakan untuk Payment (opsional jika diperlukan)  
        can('read', 'Payment', { ID_User: user._id });  
  
        // Kebijakan untuk NewsEvent  
        can('create', 'NewsEvent'); // Artist bisa membuat berita/acara  
        can('read', 'NewsEvent'); // Artist bisa membaca berita/acara  
        can('update', 'NewsEvent', { ID_Creator: user._id }); // Artist bisa memperbarui berita/acara yang mereka buat  
        can('delete', 'NewsEvent', { ID_Creator: user._id }); // Artist bisa menghapus berita/acara yang mereka buat  
    },  
    admin(user, { can }) {  
        can('manage', 'all'); // Admin bisa melakukan semua tindakan  
        can('read', 'Conversation');  
        can('create', 'Message');  
        can('read', 'Message');  
  
        // Kebijakan untuk ArtRequest_Artwork  
        can('read', 'ArtRequest_Artwork');  
        can('update', 'ArtRequest_Artwork');  
        can('delete', 'ArtRequest_Artwork');  
  
        // Kebijakan untuk Address  
        can('read', 'Address');  
        can('update', 'Address');  
        can('delete', 'Address');  
  
        // Kebijakan untuk OriginAddress  
        can('create', 'OriginAddress');  
        can('read', 'OriginAddress');  
        can('update', 'OriginAddress');  
        can('delete', 'OriginAddress');  
  
        // Kebijakan untuk Order  
        can('read', 'Order');  
        can('update', 'Order');  
  
        // Kebijakan untuk Shipment  
        can('read', 'Shipment');  
        can('update', 'Shipment');  
  
        // Kebijakan untuk Payment  
        can('read', 'Payment');  
        can('update', 'Payment');  
        can('delete', 'Payment'); // Admin bisa menghapus data pembayaran jika diperlukan  
  
        // Kebijakan untuk NewsEvent  
        can('create', 'NewsEvent'); // Admin bisa membuat berita/acara  
        can('read', 'NewsEvent'); // Admin bisa membaca semua berita/acara  
        can('update', 'NewsEvent'); // Admin bisa memperbarui semua berita/acara  
        can('delete', 'NewsEvent'); // Admin bisa menghapus semua berita/acara  

        can('update', 'Gallery');
        can('create', 'Gallery');
        can('delete', 'Gallery');
    },  
};  
  
// Fungsi untuk membuat policy berdasarkan role pengguna  
const policyFor = (user) => {  
    const { can, rules } = new AbilityBuilder(Ability);  
  
    // Gunakan properti 'role' untuk menentukan kebijakan  
    const rolePolicy = policies[user?.role?.toLowerCase() || 'guest']; // Ganti User_Type menjadi role  
    if (typeof rolePolicy === 'function') {  
        rolePolicy(user, { can });  
    }  
  
    return new Ability(rules); // Mengembalikan instance Ability dengan aturan sesuai role  
};  
  
module.exports = policyFor;  
