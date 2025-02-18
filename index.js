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
    
    //! [Simple] Réaliser une requete pour afficher les sections
    const demo01 = await client.query('SELECT section_id, section_name FROM section');

    const sections = demo01.rows.map((r => ({
        name: r.section_name,
        code: r.section_id
    })))

    for (const section of sections) {
        console.log(`${section.code} - ${section.name}`);
    }
    console.log();


    //! [Parametre] Requete pour obtenir la liste des stagiaires sur base du prénom
    const cible1 = 'Tom'; // ← Donnée reçu (Cas réel : Param de route en express)
    const cible2 = 'Davit\' OR 1=1; --'

    // Pour construire la requete, il ne faut JAMAIS concaténer !!!!!!!!!!!!!!!!!!!
    // À la place, vous pouvez utiliser des requetes parametré !
    const demo02 = await client.query(`
        SELECT first_name AS "fname", last_name AS "lname", year_result AS "result"
        FROM student
        WHERE first_name = $1
    `, [cible2]);

    if(demo02.rowCount > 0) {
        console.log(`Nombre d'étudiant trouve : ${demo02.rowCount}`);
        for(const student of demo02.rows) {
            console.log(` - ${student.fname} ${student.lname} ${student.result}`);
        }
    }
    else {
        console.log('Aucun étudiant trouvé !!!');
    }

    //? Syntaxe alternative 
    /*
    const request02 = {
        text: ` SELECT first_name AS "fname", last_name AS "lname", year_result AS "result"
                FROM student
                WHERE first_name = $1 `,
        values: [cible2]
    };
    const demo02_2 = await client.query(request02);
    */
   console.log();


    //! [Prepared Statement] Optimisation de requete
    const minResult = 10;

    const request03 = {
        name: 'section-avg-result',
        text: ` SELECT s.section_name, AVG(st.year_result) AS "avg_result"
                FROM section s
                 LEFT JOIN student st ON s.section_id = st.section_id
                GROUP BY s.section_name
                HAVING AVG(st.year_result) >= $1 `,
        values: [minResult]
    }

    const demo03 = await client.query(request03);
    console.log(demo03.rows);
    
    //! Fermer la connexion vers la DB
    await client.end();
    
})();