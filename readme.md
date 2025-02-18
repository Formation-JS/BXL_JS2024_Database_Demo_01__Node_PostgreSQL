# Demo de l'utilisation de PostgreSQL en Node

## Package
```
npm install pg
```

## Connection vers la base de donnée PostgreSQL

### Client
Permet de créer une connexion avec la DB qui se libéré à la fin de la requete.

### Pool
Permet de créer un ensemble de connexion qui sont établie avec la DB. \
Une des connexion peut être utilisé et libéré. \
Ensuite celle-ci est de-nouveau disponible dans le "pool" de connexion.