const db = require('../../database/database');  
  
// Controller untuk menampilkan profil artist berdasarkan ID_User  
const getArtistProfile = async (req, res) => {  
    const { id } = req.params; // Mengambil ID_User dari parameter  
  
    try {  
        // Mengambil data artist dari tabel users  
        const artistQuery = `  
            SELECT ID_User, Username, Email, Phone_Number, Photo, Artist_Name, Bio   
            FROM users   
            WHERE ID_User = ? AND User_Type = 'Artist'  
        `;  
        const [artistResults] = await db.query(artistQuery, [id]);  
  
        // Jika artist tidak ditemukan  
        if (artistResults.length === 0) {  
            return res.status(404).json({ message: 'Artist tidak ditemukan.' });  
        }  
  
        const artist = artistResults[0];  
  
        // Mengambil artwork yang dibuat oleh artist  
        const artworkQuery = `  
            SELECT ID_Artwork, Title_Artwork, ArtworkImage, Status   
            FROM Artwork   
            WHERE ID_Creator = ?  
        `;  
        const [artworks] = await db.query(artworkQuery, [id]);  
  
        // Menyusun data untuk ditampilkan  
        const artistProfile = {  
            ID_User: artist.ID_User,  
            Username: artist.Username,  
            Email: artist.Email,  
            Phone_Number: artist.Phone_Number,  
            Photo: artist.Photo,  
            Artist_Name: artist.Artist_Name,  
            Bio: artist.Bio,  
            Artworks: artworks  
        };  
  
        // Mengembalikan response  
        res.status(200).json(artistProfile);  
    } catch (err) {  
        console.error("Kesalahan saat mengambil profil artist:", err);  
        res.status(500).json({ message: 'Kesalahan saat mengambil profil artist.' });  
    }  
};  
  
module.exports = { getArtistProfile };  
