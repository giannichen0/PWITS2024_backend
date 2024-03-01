# Parte backend del project work ITS Ferrara 2024 by Gianni Chen

## Installation:
1. __git clone https://github.com/giannichen0/PWITS2024_backend__
2. __crea un .env file con i tuoi dati__
3. __npm start__ o __npm run dev__ se vuoi lanciarlo in development 

## .env file requirements:
- MONGO_DB_URI: la tua connection string di mongoDb
- ACCESS_TOKEN_SECRET: il tuo access_token_secret
- REFRESH_TOKEN_SECRET: il tuo refresh_token_secret
- APP_PASSWORD_GIANNICHEN: il tuo gmail app password oppure altro email provider password

## Gmail
Se vuoi usare Gmail devi andare in impostazioni del tuo account -> sicurezza. Qua accertati che hai il 2FA attivato e generare una app password

## MongoDb Schemas
5 collection: Admin, Doctor, Patient, Report, Exam
- Patient ha un vincolo su Doctor
- Report ha un vincolo su Doctor e Patient
- Exam ha un vincolo su Patient, Report
#### Extra:
Il campo "doctor" in Exam indica il dottore che effetuerà la visita

Il campo "field" in Exam e Report devono coincidere

il campo "patient" in Exam e Report devono coincidere

il campo "completed" in Exam di deafult è false

Il campo "doctor" in Report deve coincidere con il campo "doctor" del paziente

Se elimino un Doctor, elimino tutti i Patient e Report che hanno un vincolo con quel Doctor

Se elimino un Patient, elimino tutti gli Exam e Report che hanno un vincolo con quel Doctor

Se elimino un Report, elimino tutti gli Exam che hanno come soggetto quel Report

## Endpoints
/doctor e /patient usano l'access token per prendere l'id dell'utente loggato

Tutte le rotte implementano le logiche descritte in mongoDb Schemas

"?" indica che quella property può essere opzionale
- /auth : Pubblica
    - / : 
        - POST, genera un access token(id, role) e setta un httpOnly cookie con opzione secure=true contenente il refresh token(id,role). body = {email, password}.
    - /refresh : 
        - GET, torna un nuovo access_token 
    - /logout : 
        - POST, elimina il httpOnly cookie

- /admin: Privata, solo accesso se role = admin
    - / : 
        - POST, crea un nuovo admin. body = {name, surname, password, email, telefono}
        - GET, ritorna tutti gli admin
    - /doctors : 
        - GET, ritorna tutti i dottori
        - POST, crea un nuovo dottore. body = {name, surname, password, email, telefono}
        - PUT, modifica un dottore. body = {name?, surname?, password?, email?, telefono?, id}
        - DELETE, elimina un dottore. body = {id}
    - /patients : 
        - GET, ritorna tutti i pazienti
        - POST, crea un nuovo paziente. body = {name, surname, password, email, telefono, doctor}
        - PUT, modifica un paziente. body = {name?, surname?, password?, email?, telefono?, doctor, id}
        - DELETE, elimina un paziente. body = {id}
    - /reports : 
        - GET, ritorna tutti i referti
        - POST, crea una nuovo referto. body = {content, field, patient, doctor}
        - PUT, modifica un referto. body = {content?, field?, patient?, doctor?, id}
        - DELETE, elimina un referto. body = {id}
    - /exams : 
        - GET, ritorna tutti gli esami
        - POST, crea una nuovo esame. body = {content, field, patient, doctor, report, completed?}
        - PUT, modifica un esame. body = {content?, field?, patient?, doctor?, report?, completed?, id}
        - DELETE, elimina un esame. body = {id}

- /doctor: Privata, solo accesso se role = doctor
    - /profile : 
        - GET, ritorna il profilo del dottore loggato
        - PUT, modifica il profilo del dottore loggato. body = {name?, surname?, password?, email?, telefono?}
    - /patients : 
        - GET, ritorna tutti i pazienti del dottore loggato 
        - POST, crea un nuovo paziente associato al medico loggato. body = {name, surname, password, email, telefono}
        - PUT, modifica un paziente del dottore loggato. body = {name?, surname?, password?, email?, telefono?, id}
        - DELETE, elimina un paziente associato al dottore loggato. body = {id}
    - /reports : 
        - GET, ritorna tutti i referti del dottore loggato
        - POST, crea una nuovo referto con il dottore loggato. body = {content, field, patient}
        - PUT, modifica un referto con il dottore loggato. body = {content?, field?, patient?, id}
        - DELETE, elimina un referto del dottore loggato. body = {id}
    - /exams : 
        - GET, ritorna tutti gli esami del dottore loggato
        - POST, crea una nuovo esame del dottore loggato. body = {content, field, patient, report, completed?}
        - PUT, modifica un esame del dottore loggato. body = {content?, field?, patient?, report?, completed?, id}
        - DELETE, elimina un esame del dottore loggato. body = {id}  

- /patient: Privata, solo accesso se role = patient
    - /profile :
        - GET, ritorna il profilo del paziente loggato
        - PUT, modifica il profilo del paziente loggato. body = {name?, surname?, password?, email?, telefono?}
    - /doctors : 
        - GET, ritorna il dottore del paziente
    - /report : 
        - GET, ritorna tutti i referti del paziente loggato
    - /exams : 
        - GET, ritorna tutti gli esami del paziente loggato

- /utility: Mista
    - /mail : Privata, solo accesso se role = admin o doctor
        - POST, invia una mail al paziente. body = {doctor, patient?, exam }
    - /pdf : Da definire
        - POST, crea un pdf, body = {doctor, patient?, exam } 
