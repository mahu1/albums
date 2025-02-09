import { IAlbum, ITrack, IArtist, IGenre } from '../Interfaces'
import { useState, useEffect } from 'react'
import albumService from '../services/album'
import trackService from '../services/track'
import artistService from '../services/artist'
import genreService from '../services/genre'
import { useFeedbackContext } from '../FeedbackMessageContextProvider'
import { FeedbackMessageType } from '../FeedbackMessageContextProvider'
import { getTracksFullLength, getTrackFullLength, getFullLengthSeconds, getMinutes, getSeconds, mapTracksToRecord, getDiscsLengths } from '../AlbumUtils'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { strings } from '../Localization'
import StyledRating from '@mui/material/Rating'
import Select, { MultiValue } from "react-select"
import { Genre } from '../AlbumUtils'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, Tooltip } from '@mui/material'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import { ConfirmDialog } from '../components/ConfirmDialog'

const AlbumTitlePaper = styled(Paper)(() => ({
  background: '#fafafa'
}))

export const AlbumEdit= () => {
    const { id } = useParams() as { id: string }
    const { setFeedbackMessage } = useFeedbackContext()
    const navigate = useNavigate()
    const [artists, setArtists] = useState<IArtist[]>([])
    const [genres, setGenres] = useState<IGenre[]>([])
    const [selectedGenres, setSelectedGenres] = useState<Genre[]>([])
    const [newTrackDiscNumber, setNewTrackDiscNumber] = useState(0)
    const [newTrackTitle, setNewTrackTitle] = useState('')
    const [newTrackLengthMinutes, setNewTrackLengthMinutes] = useState(0)
    const [newTrackLengthSeconds, setNewTrackLengthSeconds] = useState(0)
    const [album, setAlbum] = useState<IAlbum>()
    const [track, setTrack] = useState<ITrack>()
    const [openAlbumRemoveConfirmDialog, setOpenAlbumRemoveConfirmDialog] = useState(false)
    const [openTrackRemoveConfirmDialog, setOpenTrackRemoveConfirmDialog] = useState(false)

    useEffect(() => {
      albumService.getById(+id).then(data => {
        setAlbum(data)
        setSelectedGenres(albumGenresList(data))
      })
      artistService.getAll().then(data => {
        setArtists(data)
      })
      genreService.getAll().then(data => {
        setGenres(data)
      })
    }, [id]) 

    const selectableGenresList = (album: IAlbum): Genre[] => {
      if (!album.genres) {
        return []
      }

      const selectableGenres: IGenre[] = []
      genres.forEach((genre) => {
        if (!album.genres?.find((g) => g.title === genre.title)) {
          selectableGenres.push(genre)
        }
      })

      return selectableGenres.map((genre) => ({
        value: genre,
        label: genre.title
      }))
    }

    const albumGenresList = (album: IAlbum): Genre[] => {
      if (!album.genres) {
        return []
      }
      return album.genres.sort((a, b) => a.title > b.title ? 1 : -1).map((genre) => ({
        value: genre,
        label: genre.title
      }))
    }

    const editArtist = async (album: IAlbum, artist: string): Promise<void> => {
      if (album.id) {
        const artistObject: IArtist = { title: artist }
        const editedAlbum = { ...album, artist: artistObject }
        try {
          await albumService.put(album.id, editedAlbum)
          setAlbum(await albumService.getById(album.id))
          setFeedbackMessage( {text: strings.formatString(strings.artist_edited, album.artist.title, artist), feedbackMessageType: FeedbackMessageType.Info} )
        } catch (error) {
          if (error instanceof Error && error.message === 'Request failed with status code 302') {
            setFeedbackMessage( {text: strings.formatString(strings.artist_edited, artist, album.title), feedbackMessageType: FeedbackMessageType.Error} )
          }
        }
      }
    }

    const editTitle = async (album: IAlbum, title: string): Promise<void> => {
      if (title.length === 0) {
        setFeedbackMessage( {text: strings.album_title_cannot_be_empty, feedbackMessageType: FeedbackMessageType.Error} )
        return
      }

      if (album.id && album.title !== title) {
        const editedAlbum = { ...album, title: title }
        try {
          await albumService.put(album.id, editedAlbum)
          setAlbum(await albumService.getById(album.id))
          setFeedbackMessage( {text: strings.formatString(strings.album_title_edited, album.title, title), feedbackMessageType: FeedbackMessageType.Info} )
        } catch (error) {
          if (error instanceof Error && error.message === 'Request failed with status code 302') {
            setFeedbackMessage( {text: strings.formatString(strings.album_already_found, album.artist.title, title), feedbackMessageType: FeedbackMessageType.Error} )
          }
        }
      }
    }

    const editReleaseDate = async (album: IAlbum, releaseDate: string): Promise<void> => {
      if (releaseDate.length === 0) {
        setFeedbackMessage( {text: strings.release_date_cannot_be_empty, feedbackMessageType: FeedbackMessageType.Error} )
        return
      }

      if (album.id && album.releaseDate !== releaseDate) {
        const editedAlbum = { ...album, releaseDate: releaseDate }
        await albumService.put(album.id, editedAlbum)
        setAlbum(await albumService.getById(album.id))
        setFeedbackMessage( {text: strings.formatString(strings.release_date_edited, album.releaseDate ? album.releaseDate : '', releaseDate), feedbackMessageType: FeedbackMessageType.Info} )
      }
    }

    const editCover = async (album: IAlbum, cover: string): Promise<void> => {
      if (cover.length === 0) {
        setFeedbackMessage( {text: strings.cover_cannot_be_empty, feedbackMessageType: FeedbackMessageType.Error} )
        return
      }

      if (album.id && album.cover !== cover) {
        const editedAlbum = { ...album, cover: cover }
        await albumService.put(album.id, editedAlbum)
        setAlbum(await albumService.getById(album.id))
        setFeedbackMessage( { text: strings.formatString(strings.cover_edited, album.cover!.split('/').pop() as string, cover.split('/').pop() as string), feedbackMessageType: FeedbackMessageType.Info} )
      }
    }

    const editGenres = async (selectedGenres: MultiValue<Genre>): Promise<void> => {
      const converted = selectedGenres as Genre[]
      setSelectedGenres(converted)
      if (album && album.id && album.genres) {
        const editedAlbum = { ...album, genres: selectedGenres.map(g => g.value) }
        await albumService.put(album.id, editedAlbum)
        setAlbum(await albumService.getById(album.id))
        setFeedbackMessage( { text: strings.formatString(strings.genres_edited, album.genres.sort((a, b) => a.title > b.title ? 1 : -1).map(genre => genre.title).join(', '), converted.sort().sort((a, b) => a.label > b.label ? 1 : -1).map(genre => genre.label).join(', ')), feedbackMessageType: FeedbackMessageType.Info} )
      }
    }

    const rateAlbum = async (album: IAlbum, rating: number | undefined): Promise<void> => {
      if (album.id) {
        const editedAlbum = { ...album, rating: rating }
        await albumService.put(album.id, editedAlbum)
        setAlbum(await albumService.getById(album.id))
        setFeedbackMessage( { text: strings.formatString(strings.rating_edited, album.rating ? album.rating : '', rating ? rating : '') as string, feedbackMessageType: FeedbackMessageType.Info} )
      }
    }

    const editTrackTitle = async (track: ITrack, trackTitle: string): Promise<void> => {
      if (trackTitle.length === 0) {
        setFeedbackMessage( {text: strings.track_title_cannot_be_empty, feedbackMessageType: FeedbackMessageType.Error} )
        return
      }

      if (track.id && track.title !== trackTitle) {
        const changedTrack: {} = { title: trackTitle }
        await trackService.patch(track.id, changedTrack)
        setAlbum(await albumService.getById(+id))
        setFeedbackMessage( { text: strings.formatString(strings.track_title_edited, track.title, trackTitle), feedbackMessageType: FeedbackMessageType.Info} )
      }
    }

    const editTrackLengthMinutes = async (track: ITrack, trackLengthMinutes: number): Promise<void> => {
      if (track.id && getMinutes(track.seconds) !== trackLengthMinutes) {
        if (isNaN(trackLengthMinutes)) {
          setFeedbackMessage( { text: strings.track_minutes_cannot_be_empty, feedbackMessageType: FeedbackMessageType.Error } )
          return
        } else if (trackLengthMinutes < 0) {
          setFeedbackMessage( { text: strings.track_minutes_cannot_be_negative, feedbackMessageType: FeedbackMessageType.Error } )
          return
        } else if (trackLengthMinutes > 99) {
          setFeedbackMessage( { text: strings.track_minutes_maximum_value_is_99, feedbackMessageType: FeedbackMessageType.Error } )
          return
        }
        const trackLength = getFullLengthSeconds(trackLengthMinutes, getSeconds(track.seconds))
        const changedTrack: {} = { seconds: trackLength }
        await trackService.patch(track.id, changedTrack)
        setAlbum(await albumService.getById(+id))
        setFeedbackMessage( { text: strings.formatString(strings.track_length_edited, getTrackFullLength(track.seconds), getTrackFullLength(trackLength)), feedbackMessageType: FeedbackMessageType.Info } )
      }
    }

    const editTrackLengthSeconds = async (track: ITrack, trackLengthSeconds: number): Promise<void> => {
      if (track.id && getSeconds(track.seconds) !== trackLengthSeconds) {
        if (isNaN(trackLengthSeconds)) {
          setFeedbackMessage( { text: strings.track_seconds_cannot_be_empty, feedbackMessageType: FeedbackMessageType.Error } )
          return
        } else if (trackLengthSeconds < 0) {
          setFeedbackMessage( { text: strings.track_seconds_cannot_be_negative, feedbackMessageType: FeedbackMessageType.Error } )
          return
        } else if (trackLengthSeconds > 59) {
          setFeedbackMessage( { text: strings.track_seconds_maximum_value_is_59, feedbackMessageType: FeedbackMessageType.Error } )
          return
        }
        const trackLength = getFullLengthSeconds(getMinutes(track.seconds), trackLengthSeconds)
        const changedTrack: {} = { seconds: trackLength }
        await trackService.patch(track.id, changedTrack)
        setAlbum(await albumService.getById(+id))
        setFeedbackMessage( { text: strings.formatString(strings.track_length_edited, getTrackFullLength(track.seconds), getTrackFullLength(trackLength)), feedbackMessageType: FeedbackMessageType.Info } )
      }
    }

    const removeAlbum = async (album: IAlbum): Promise<void> => {
      if (album.id) {
        await albumService.remove(album.id)
        setOpenAlbumRemoveConfirmDialog(false)
        setFeedbackMessage({ text: strings.formatString(strings.album_removed, album.artist.title, album.title), feedbackMessageType: FeedbackMessageType.Info } )
        navigate('/')
      }
    }

    const addTrack = async (e: React.FormEvent): Promise<void> => {
      e.preventDefault()
      const trackNumber = tracksMap[newTrackDiscNumber] === undefined ? 1 : tracksMap[newTrackDiscNumber].length + 1
      if (album?.id) {
        const track: ITrack = {
          discNumber: newTrackDiscNumber,
          trackNumber: trackNumber,
          title: newTrackTitle,
          seconds: getFullLengthSeconds(newTrackLengthMinutes, newTrackLengthSeconds),
          albumId: album.id
        }

        await trackService.create(track)
        setAlbum(await albumService.getById(+id))
        setFeedbackMessage( { text: strings.formatString(strings.track_added, track.title), feedbackMessageType: FeedbackMessageType.Info })
        
        setNewTrackTitle('')
        setNewTrackLengthMinutes(0)
        setNewTrackLengthSeconds(0)
      }
    }

    const removeTrackClick = async (e: React.FormEvent, track: ITrack): Promise<void> => {
      e.preventDefault()
      setTrack(track)
      setOpenTrackRemoveConfirmDialog(true)
    }
    
    const removeTrack = async (): Promise<void> => {
      if (track && track.id) {
        await trackService.remove(track.id)
        setAlbum(await albumService.getById(+id))
        setOpenTrackRemoveConfirmDialog(false)
        setFeedbackMessage({ text: strings.formatString(strings.track_removed, track.title), feedbackMessageType: FeedbackMessageType.Info })
      }
    }

    const moveTrackUp = async (e: React.FormEvent, track: ITrack): Promise<void> => {
      e.preventDefault()
      if (track.id) {
        const discNumberChange = track.trackNumber === 1
        let trackNumber = track.trackNumber - 1
        let discNumber = track.discNumber
        if (discNumberChange) {
          trackNumber = tracksMap[track.discNumber - 1].length
          discNumber--
        }
        moveTrackUpdate(track, discNumber, trackNumber, discNumberChange)
      }
    }

    const moveTrackDown = async (e: React.FormEvent, track: ITrack): Promise<void> => {
      e.preventDefault()
      if (track.id) {
        const discNumberChange = tracksMap[track.discNumber].length === track.trackNumber ? true : false
        let trackNumber = track.trackNumber + 1
        let discNumber = track.discNumber
        if (discNumberChange) {
          trackNumber = 1
          discNumber++
        }
        moveTrackUpdate(track, discNumber, trackNumber, discNumberChange)
      }
    }

    const moveTrackUpdate = async (track: ITrack, discNumber: number, trackNumber: number, discNumberChange: boolean): Promise<void> => {
      if (track.id) {
        const changedTrack: {} = { trackNumber: trackNumber, discNumber: discNumber } 
        await trackService.patch(track.id, changedTrack)
        setAlbum(await albumService.getById(+id))
        let feebackText = strings.formatString(strings.track_number_edited, track.trackNumber, trackNumber)
        if (discNumberChange) {
          feebackText = strings.formatString(strings.track_disc_and_number_edited, track.discNumber, discNumber, track.trackNumber, trackNumber)
        }
        setFeedbackMessage({ text: feebackText as string, feedbackMessageType: FeedbackMessageType.Info })
      }
    }

    const tracksMap = mapTracksToRecord(album?.tracks === undefined ? [] : album.tracks)

    return (
      <>
        {!album ? (
          <div></div>
        ) : (
          <div>
            <br/>
            <br/>
            <div className="albumInformation">
              <AlbumTitlePaper elevation={1}>
                <span className="marginRight">
                  <select value={album.artist.title} onChange={(e) => editArtist(album, e.target.value)}>
                      {artists.map((artist) => (
                        <option key={artist.title} value={artist.title}>{artist.title}</option>
                      ))}
                  </select>
                  <Link to={`/artists`}><img src="../icons8-edit.png" className="staticIconSmall" alt={strings.edit_artists} title={strings.edit_artists}/><img src="../icons8-edit.gif" className="activeIconSmall" alt={strings.edit_artists} title={strings.edit_artists}/></Link>
                </span>
                <span className="marginRight">
                  <input required type="text" placeholder={strings.album_title} name="title" key={album.title} defaultValue={album.title} onBlur={(e) => editTitle(album, e.target.value)} />
                </span>
                <span className="marginRight">
                  <input required type="date" placeholder={strings.release_date} name="releaseDate" key={album.releaseDate} defaultValue={album.releaseDate} onBlur={(e) => editReleaseDate(album, e.target.value)} />
                </span>
                <span className="marginRight">
                  <input required type="url" placeholder={strings.cover} name="cover" key={album.cover} defaultValue={album.cover} onBlur={(e) => editCover(album, e.target.value)} />
                </span>
                <span className="marginRight">
                  <button onClick={() => setOpenAlbumRemoveConfirmDialog(true)}><img src="../icons8-delete.png" alt={strings.release_date} title={strings.remove_album} /></button>
                </span>
                <div className="selectList">
                  <Select className="selectListInput" options={selectableGenresList(album)} placeholder={strings.genres} value={selectedGenres} onChange={editGenres} isSearchable={true} isMulti />
                  <Link to={`/genres`}><img src="../icons8-edit.png" className="staticIconSmall" alt={strings.edit_genres} title={strings.edit_genres}/><img src="../icons8-edit.gif" className="activeIconSmall" alt={strings.edit_genres} title={strings.edit_genres}/></Link>
                </div>
              </AlbumTitlePaper>
              <div className="albumImgAndRating">
                <Link to={`/album/${album.id}`}><img className="albumImg" src={album.cover} alt={album.title} title={album.artist.title + " - " + album.title} /></Link>
                <div className="textCenter">
                  <StyledRating 
                    value={album.rating}
                    precision={0.5}
                    size="large" 
                    onChange={(event, newRating) => {
                      if (newRating !== null) {
                          rateAlbum(album, newRating)
                      } else {
                          rateAlbum(album, undefined)
                      }
                }} /></div>
              </div>
              <div className="albumInformation">
                <form onSubmit={(e) => addTrack(e)}>
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650, maxWidth: 850 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>{strings.disc}</TableCell>
                          <TableCell>{strings.no}</TableCell>
                          <TableCell>{strings.title}</TableCell>
                          <TableCell>{strings.length}</TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                          {Object.keys(tracksMap).map(discNumber => (tracksMap[parseInt(discNumber)]
                            .map((track, index) => (
                              <TableRow key={track.id}>
                                {index === 0 && (<TableCell rowSpan={tracksMap[parseInt(discNumber)].length}>{track.discNumber}</TableCell>)}
                                <TableCell>{track.trackNumber}</TableCell>
                                <TableCell><input required type="text" placeholder={strings.track_title} name="trackTitle" defaultValue={track.title} onBlur={(e) => editTrackTitle(track, e.target.value)} /></TableCell>
                                <TableCell style={{whiteSpace: 'nowrap'}}><input required type="number" placeholder={strings.mm} min="0" max="99" name="trackLengthMinutes" defaultValue={getMinutes(track.seconds)} onBlur={(e) => editTrackLengthMinutes(track, e.target.valueAsNumber)} />:<input required type="number" placeholder={strings.ss} min="0" max="59" name="trackLengthSeconds" defaultValue={getSeconds(track.seconds)} onBlur={(e) => editTrackLengthSeconds(track, e.target.valueAsNumber)} /></TableCell>
                                {track.discNumber !== 1 || track.trackNumber !== 1 ? <TableCell><button onClick={(e) => moveTrackUp(e, track)}><img src="../icons8-up.png" alt={strings.move_up} title={strings.move_up} /></button></TableCell> : <TableCell />}
                                {Object.values(tracksMap).flat().slice(-1)[0].id !== track.id ? <TableCell><button onClick={(e) => moveTrackDown(e, track)}><img src="../icons8-down.png" alt={strings.move_down} title={strings.move_down} /></button></TableCell> : <TableCell />}
                                <TableCell><button onClick={(e) => removeTrackClick(e, track)}><img src="../icons8-delete.png" alt={strings.remove_track} title={strings.remove_track} /></button></TableCell>
                              </TableRow>
                          ))))}
                        <TableRow>
                          <TableCell><input required type="number" placeholder={strings.track_title} min="1" name="newTrackDiscNumber" defaultValue={Object.keys(tracksMap).length === 0 ? 1 : Object.keys(tracksMap).length} onChange={(e) => setNewTrackDiscNumber(e.target.valueAsNumber)} /></TableCell>
                          <TableCell />
                          <TableCell><input required type="text" placeholder={strings.track_title} name="newTrackTitle" value={newTrackTitle} onChange={(e) => setNewTrackTitle(e.target.value)} /></TableCell>
                          <TableCell><input required type="number" placeholder={strings.mm} min="0" max="99" name="newTrackLengthMinutes" value={newTrackLengthMinutes} onChange={(e) => setNewTrackLengthMinutes(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />:<input required type="number" placeholder={strings.ss} min="0" max="59" name="newTrackLengthSeconds" value={newTrackLengthSeconds} onChange={(e) => setNewTrackLengthSeconds(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} /></TableCell>
                          <TableCell/>
                          <TableCell/>
                          <TableCell><button type="submit"><img src="../icons8-plus.png" alt={strings.add_track} title={strings.add_track} /></button></TableCell>
                        </TableRow>
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell><Tooltip title={getDiscsLengths(tracksMap)}><Link to={''}>{getTracksFullLength(album.tracks)}</Link></Tooltip></TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell />
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </TableContainer>
                </form>
              </div>
            </div>
            <ConfirmDialog 
              open={openAlbumRemoveConfirmDialog} 
              close={() => setOpenAlbumRemoveConfirmDialog(false)}
              action={() => removeAlbum(album)}
              titleText={strings.formatString(strings.are_you_sure_you_want_to_remove_album, album.artist.title, album.title) as string}
              contentText=""
              actionButtonText={strings.formatString(strings.remove) as string} />
            <ConfirmDialog 
              open={openTrackRemoveConfirmDialog} 
              close={() => setOpenTrackRemoveConfirmDialog(false)}
              action={() => removeTrack()}
              titleText={strings.formatString(strings.are_you_sure_you_want_to_remove_track, track ? track.title : '') as string}
              contentText=""
              actionButtonText={strings.formatString(strings.remove) as string} />
          </div>
        )}
      </>
    )
}
