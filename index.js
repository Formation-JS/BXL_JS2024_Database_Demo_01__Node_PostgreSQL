import pg from 'pg';
const { Client } = pg;

(async () => {
    
    //! Configure le client DB
    //? - Avec les options explicit
    const client = new Client({
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
    });
    //? - Sans options (-> Config automatique via les variables d'env)
    // const client = new Client();

    //! Ouvrir la connexion vers la DB
    await client.connect();
    
    //! Réaliser une requete pour afficher les sections
    const sectionResult = await client.query('SELECT section_id, section_name FROM section');

    const sections = sectionResult.rows.map((r => ({
        name: r.section_name,
        code: r.section_id
    })))

    for (const section of sections) {
        console.log(`${section.code} - ${section.name}`);
    }
    
    //! Fermer la connexion vers la DB
    await client.end();
    
})();