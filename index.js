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
    console.log();

    
    //! [Transaction] Ajouter un étudiant avec sa section
    //? Une nouvelle etudiante
    // const data = {
    //     firstname: 'Della',
    //     lastname: 'Duck',
    //     yearResult: 17,
    //     login: 'deduck',
    //     courseId: '0',
    //     sectionId: 1010,
    //     sectionName: undefined // ← Uniquement pour les nouvelles sections 
    // }

    //? Une nouvelle etudiante avec une nouvelle section
    // const data = {
    //     firstname: 'Miss tick',
    //     lastname: 'De sortilège',
    //     yearResult: 3,
    //     login: 'misstick',
    //     courseId: '0',
    //     sectionId: 1030,
    //     sectionName: 'Magie'
    // }

    //? Un nouvel etudiant en ERREUR avec une nouvelle section
    const data = {
        firstname: 'Gontran',
        lastname: 'Bonheur',
        yearResult: 21,
        login: 'bonheur',
        courseId: undefined,
        sectionId: 4242,
        sectionName: 'Test'
    }

    try {
        //? Debut de la transaction
        await client.query('BEGIN');

        // Check si la section existe
        const demo04_1 = await client.query(
            'SELECT * FROM section WHERE section_id = $1', 
            [data.sectionId]
        );

        // Création de la section si elle n'existe pas !
        if(demo04_1.rowCount === 0) {
            await client.query(
                'INSERT INTO section (section_id, section_name, delegate_id) VALUES ($1, $2, 1)',
                [data.sectionId, data.sectionName]
            );
        }

        await client.query(
            ` INSERT INTO student (student_id, first_name, last_name, year_result, login, course_id, section_id)
               VALUES ((SELECT MAX(student_id)+1 FROM student), $1, $2, $3, $4, $5, $6)`,
            [data.firstname, data.lastname, data.yearResult, data.login, data.courseId, data.sectionId]
        );

        console.log('Insert finish !');

        //? Validation de la transaction
        await client.query('COMMIT');
    }
    catch (error) {
        console.log(error);

        //? Annulation de la transaction
        await client.query('ROLLBACK');
    }

    
    //! Fermer la connexion vers la DB
    await client.end();
    
})();